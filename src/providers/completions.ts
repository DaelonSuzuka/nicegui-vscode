import {
	CancellationToken,
	CompletionContext,
	CompletionItem,
	CompletionItemLabel,
	CompletionItemProvider,
	CompletionList,
	ExtensionContext,
	MarkdownString,
	Position,
	Range,
	SnippetString,
	TextDocument,
} from 'vscode';
import * as vscode from 'vscode';
import { createLogger } from '../utils';
import { type JSONObject, type JSONValue, quasarData, quasarLists, tailwindClasses } from './data';
import { get_word_at_position, get_word_at_range } from './doc_utils';

const log = createLogger('completions');

function build_completions(list: string[], word: string, wordRange: Range) {
	const items: CompletionItem[] = [];
	for (const possible of list) {
		if (word === '') {
			items.push(new CompletionItem(possible));
		} else if (possible.includes(word)) {
			const item = new CompletionItem(possible);
			item.range = wordRange;
			items.push(item);
		}
	}
	return items;
}

function flatten(item: string | string[] | JSONValue, join: string): string {
	if (typeof item === 'string') {
		return item;
	}
	if (Array.isArray(item)) {
		return item.join(join);
	}
}

export class NiceGuiCompletionItemProvider implements CompletionItemProvider {
	// biome-ignore lint/suspicious/noExplicitAny: <vscode API?>
	pylance: vscode.Extension<any>;

	constructor(private context: ExtensionContext) {
		const selector = [{ language: 'python', scheme: 'file' }];

		this.pylance = vscode.extensions.getExtension('ms-python.vscode-pylance');

		this.context.subscriptions.push(vscode.languages.registerCompletionItemProvider(selector, this));
	}

	async request_hover(document: TextDocument, position: Position): Promise<string | null> {
		if (!this.pylance?.isActive) {
			return null;
		}
		const client = await this.pylance.exports.client.getClient();

		const response = await client._connection.sendRequest('textDocument/hover', {
			textDocument: { uri: document.uri.toString() },
			position: {
				line: position.line,
				character: position.character,
			},
		});
		return response?.contents?.value ?? null;
	}

	async request_type(document: TextDocument, position: Position): Promise<string | null> {
		if (!this.pylance?.isActive) {
			return null;
		}
		const client = await this.pylance.exports.client.getClient();

		const response = await client._connection.sendRequest('textDocument/typeDefinition', {
			textDocument: { uri: document.uri.toString() },
			position: {
				line: position.line,
				character: position.character,
			},
		});
		return response?.contents?.value ?? null;
	}

	async provideCompletionItems(
		document: TextDocument,
		position: Position,
		token: CancellationToken,
		context: CompletionContext,
	): Promise<CompletionItem[] | CompletionList<CompletionItem>> {
		// log.debug('----------- provideCompletionItems -----------');

		// get the entire text up until the cursor
		//! performance implications?
		const prefix = document.getText().slice(0, document.offsetAt(position));
		// log.debug("prefix", prefix);

		// look backwards for ".<func>("
		const result = prefix.match(/\.\s*(props|classes|style|on|run_method|add_slot)\s*\(\s*[^\)]+$/);
		// log.debug('result', result);

		if (!result) {
			return undefined;
		}

		// get the string literal from under the cursor
		const surroundPattern = /(?<=(["']))(?:(?=(\\?))\2.)*?(?=\1)/;
		const surround = get_word_at_position(document, position, surroundPattern);
		// log.debug(`surround ${surround}`);

		// get the word from under the cursor
		const wordPattern = /[\.\w\/-]+|([\"'])\1/;
		const wordRange = document.getWordRangeAtPosition(position, wordPattern);
		const word = get_word_at_range(document, wordRange) ?? '';
		// log.debug(`word ${word}`);

		const map = {
			classes: 'classes',
			props: 'props',
			add_slot: 'slots',
			on: 'events',
			run_method: 'methods',
			style: 'style',
		};

		const kind = map[result[1]];
		// log.debug('kind', kind);

		// ironically, "classes" doesn't rely on knowing the class
		if (kind === 'classes') {
			if (surround === null) {
				return undefined;
			}
			return build_completions(tailwindClasses, word, wordRange);
		}

		// style not supported yet
		if (kind === 'style') {
			return undefined;
		}

		const offset = document.offsetAt(position) - result[0].length;

		// define an internal function just for flow control
		const determine_class = async () => {
			if (['classes', 'props', 'style', 'events'].includes(kind)) {
				const hoverPosition = document.positionAt(offset + 1);
				const body = await this.request_hover(document, hoverPosition);
				if (['classes', 'props', 'style'].includes(kind)) {
					const match = body.match(
						/\(property\) (?:classes|props|style): (?:Classes|Props|Style)\[(?:Self@)?([\w_]+)\]/,
					);
					if (match) {
						return match[1];
					}
				} else if (['events'].includes(kind)) {
					const match = body.match(/\(method\) def on\([^\)]*\) -> (\w+)/m);
					if (match) {
						return match[1];
					}
				}
			} else {
				// log.debug("other");

				//TODO: fix this awful mess
				const body1 = await this.request_hover(document, document.positionAt(offset - 1));
				// log.debug("body1", body1);
				if (body1) {
					const match = body1.match(/\(variable\) [\w_]*: ([\w_]+)/);
					// log.debug("match1", match);
					if (match) {
						return match[1];
					}
				}
				const body2 = await this.request_hover(document, document.positionAt(offset - 3));
				// log.debug("body2", body2);
				if (body2) {
					const match = body2.match(/class ([\w_]+)\(/);
					// log.debug("match2", match);
					if (match) {
						return match[1];
					}
				}
			}
			return null;
		};

		let className = null;
		const possibleClass = await determine_class();
		if (possibleClass) {
			// Convert NiceGUI types to Quasar types
			className = `Q${possibleClass}`;
			className = className.replace('Button', 'Btn');
			className = className.replace('Image', 'Img');
			className = className.toLowerCase();
		}

		function build_item(name: string, data: JSONObject) {
			const label: CompletionItemLabel = {
				label: name,
				// detail: '',
				// description: '',
			};
			label.description = flatten(data.type, ' | ');

			// log.debug(data.returns, data.params, data.returns !== undefined);
			if (data.params !== undefined && data.returns !== undefined) {
				let params = 'void';
				if (data.params !== null) {
					// const _params: string[] = [];
					// for (const [param, body] of Object.entries(data.params)) {
					// 	const type = flatten(body.type, " | ");
					// 	const p = `${param}: ${type}`;
					// 	_params.push(p);
					// }

					// params = _params.join(", ");
					params = Object.keys(data.params).join(', ');
				}
				let returns = 'void';
				if (data.returns !== null) {
					returns = Object.keys(data.returns).join(', ');
				}
				label.description = `(${params}) => ${returns}`;
			} else if (data.params !== undefined) {
				let params = 'void';
				if (data.returns !== null) {
					params = Object.keys(data.params).join(', ');
				}
				label.description = `(${params})`;
			}

			const item = new CompletionItem(label);

			if (name.includes('[')) {
				const insert = new SnippetString();
				const parts = name.split('[');
				insert.appendText(parts[0]);
				insert.appendPlaceholder(`[${parts[1]}`);
				item.insertText = insert;
			}

			const doc = new MarkdownString();
			doc.appendText(data.desc as string);
			item.documentation = doc;
			if (word !== '') {
				item.range = wordRange;
			}
			return item;
		}

		const items = [];

		const classData = quasarData[className];

		function build_items(attribute: 'props' | 'slots' | 'events' | 'methods') {
			for (const [name, body] of Object.entries(classData[attribute] ?? {})) {
				if (body.internal) {
					continue;
				}
				if (word === '' || name.includes(word)) {
					const item = build_item(name, body);
					items.push(item);
				}
			}
		}

		if (classData) {
			// log.debug('using quasar metadata');
			build_items(kind);
		} else {
			// log.debug('using full lists');
			items.push(...build_completions(quasarLists[kind], word, wordRange));
		}

		// log.debug("found ", items.length);
		return items;
	}
}
