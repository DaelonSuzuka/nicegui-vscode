import * as vscode from 'vscode';
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
import { createLogger } from '../utils';
import { QuasarAttribute, flatten, quasarData, quasarLists, tailwindClasses } from './data';
import { capture_document_context } from './doc_utils';
import { PylanceAdapter } from './pylance';

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

export class NiceGuiCompletionItemProvider implements CompletionItemProvider {
	pylance = new PylanceAdapter();

	constructor(private context: ExtensionContext) {
		const selector = [{ language: 'python', scheme: 'file' }];
		this.context.subscriptions.push(vscode.languages.registerCompletionItemProvider(selector, this));
	}

	async provideCompletionItems(
		document: TextDocument,
		position: Position,
		token: CancellationToken,
		context: CompletionContext,
	): Promise<CompletionItem[] | CompletionList<CompletionItem>> {
		// log.debug('----- provideCompletionItems -----');

		// pylance will return null for hovers on string literals
		if ((await this.pylance.request_hover(document, position)) !== null) {
			return undefined;
		}

		const ctx = capture_document_context(document, position);
		// log.debug('context:', ctx);

		if (!ctx.result) {
			return undefined;
		}

		// ironically, "classes" doesn't rely on knowing the class
		if (ctx.kind === 'classes') {
			if (ctx.surround === null) {
				return undefined;
			}
			return build_completions(tailwindClasses, ctx.word, ctx.wordRange);
		}

		// style not supported yet
		if (ctx.kind === 'style') {
			return undefined;
		}

		const offset = document.offsetAt(position) - ctx.result[0].length;
		const className = await this.pylance.determine_class(document, ctx.kind, offset);

		function build_item(name: string, data: QuasarAttribute) {
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
			if (ctx.word !== '') {
				item.range = ctx.wordRange;
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
				if (ctx.word === '' || name.includes(ctx.word)) {
					const item = build_item(name, body);
					items.push(item);
				}
			}
		}

		if (classData) {
			// log.debug('using quasar metadata');
			build_items(ctx.kind);
		} else {
			// log.debug('using full lists');
			items.push(...build_completions(quasarLists[ctx.kind], ctx.word, ctx.wordRange));
		}

		// log.debug("found ", items.length);
		return items;
	}
}
