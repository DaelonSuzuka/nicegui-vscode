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
import { QuasarAttribute, flatten, quasarData, quasarLists, tailwindClasses, defaultIcons } from './data';
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

		if (!ctx) {
			return undefined;
		}

		if (ctx.kind === 'icons') {
			log.debug('building icons');
			const items = [];
			for (const icon of defaultIcons) {
				const item = new CompletionItem(icon);
				items.push(item);
			}
			return items;
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

		function build_item(name: string, attr: QuasarAttribute) {
			const label: CompletionItemLabel = {
				label: name,
				// detail: '',
				// description: '',
			};
			label.description = flatten(attr.type, ' | ');

			// log.debug(data.returns, data.params, data.returns !== undefined);
			if (attr.params !== undefined && attr.returns !== undefined) {
				let params = 'void';
				if (attr.params !== null) {
					// const _params: string[] = [];
					// for (const [param, body] of Object.entries(data.params)) {
					// 	const type = flatten(body.type, " | ");
					// 	const p = `${param}: ${type}`;
					// 	_params.push(p);
					// }

					// params = _params.join(", ");
					params = Object.keys(attr.params).join(', ');
				}
				let returns = 'void';
				if (attr.returns !== null) {
					returns = Object.keys(attr.returns).join(', ');
				}
				label.description = `(${params}) => ${returns}`;
			} else if (attr.params !== undefined) {
				let params = 'void';
				if (attr.returns !== null) {
					params = Object.keys(attr.params).join(', ');
				}
				label.description = `(${params})`;
			}

			const item = new CompletionItem(label);

			if (ctx.kind === 'slots' && name.includes('[')) {
				const insert = new SnippetString();
				const parts = name.split('[');
				insert.appendText(parts[0]);
				insert.appendPlaceholder(`[${parts[1]}`);
				item.insertText = insert;
			}

			if (ctx.kind === 'props' && attr.type !== 'Boolean') {
				const insert = new SnippetString();
				insert.appendText(`${name}=`);
				if (attr.values) {
					insert.appendChoice(attr.values.map((v) => v.slice(1, -1)));
				}
				item.insertText = insert;
			}

			const doc = new MarkdownString();
			doc.appendText(attr.desc);
			if (attr.examples) {
				let mk = '\n\n---\n\n';
				mk += 'Examples:\n';
				for (const ex of attr.examples) {
					mk += ` - ${ex.replace('#', '\\#')}\n`;
				}
				doc.appendMarkdown(mk);
			}
			if (attr.values) {
				let mk = '\n\n---\n\n';
				mk += 'Values:\n\n';
				for (const val of attr.values) {
					mk += ` - ${val.replace('#', '\\#')}\n`;
				}
				mk += '\n';
				doc.appendMarkdown(mk);
			}
			item.documentation = doc;
			if (ctx.word !== '') {
				item.range = ctx.wordRange;
			}
			return item;
		}

		const items = [];

		const classData = quasarData[className];

		function build_items(kind: 'props' | 'slots' | 'events' | 'methods') {
			if (ctx.word.includes('=')) {
				const word = ctx.word.split('=')[0];
				if (['icon', 'icon-right'].includes(word)) {
					for (const icon of defaultIcons) {
						const item = new CompletionItem(icon);
						const content = new MarkdownString();
						content.appendMarkdown(
							'<svg>M0 0h24v24H0zm0 0h24v24H0zm0 0h24v24H0z@@fill:none;&&M20 0H4v2h16V0zM4 24h16v-2H4v2zM20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-8 2.75c1.24 0 2.25 1.01 2.25 2.25s-1.01 2.25-2.25 2.25S9.75 10.24 9.75 9 10.76 6.75 12 6.75zM17 17H7v-1.5c0-1.67 3.33-2.5 5-2.5s5 .83 5 2.5V17z</svg>',
						);
						item.documentation = content;
						items.push(item);
					}
					return;
				}
				const attr = classData[kind][word];
				for (const value of attr.values ?? []) {
					const item = new CompletionItem(value.slice(1, -1));
					items.push(item);
				}
				return;
			}
			for (const [name, attr] of Object.entries(classData[kind] ?? {})) {
				if (attr.internal) {
					continue;
				}
				if (ctx.word === '' || name.includes(ctx.word)) {
					const item = build_item(name, attr);
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
