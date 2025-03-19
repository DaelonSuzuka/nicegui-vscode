import * as vscode from 'vscode';
import {
	CancellationToken,
	ExtensionContext,
	Hover,
	HoverProvider,
	MarkdownString,
	Position,
	TextDocument,
} from 'vscode';
import { createLogger } from '../utils';
import { flatten, quasarData } from './data';
import { capture_document_context } from './doc_utils';
import { PylanceAdapter } from './pylance';

const log = createLogger('providers.hover');

export class NiceGuiHoverProvider implements HoverProvider {
	pylance = new PylanceAdapter();

	constructor(private context: ExtensionContext) {
		const selector = [{ language: 'python', scheme: 'file' }];
		context.subscriptions.push(vscode.languages.registerHoverProvider(selector, this));
	}

	async provideHover(document: TextDocument, position: Position, token: CancellationToken): Promise<Hover> {
		// log.debug('----- provideHover -----');

		const ctx = capture_document_context(document, position);
		// log.debug('context:', ctx);

		if (!ctx.result) {
			return undefined;
		}

		// tailwind classes not supported yet
		if (ctx.kind === 'classes') {
			return undefined;
		}

		// style not supported yet
		if (ctx.kind === 'style') {
			return undefined;
		}
		const offset = document.offsetAt(position) - ctx.result[0].length;
		const className = await this.pylance.determine_class(document, ctx.kind, offset);
		const classData = quasarData[className];

		// log.debug(classData[ctx.kind])
		// log.debug(classData[ctx.kind][ctx.word]);
		// log.debug(classData[ctx.kind][ctx.word].desc)

		const data = classData?.[ctx.kind]?.[ctx.word];
		// log.debug('data:', data);

		if (data) {
			const contents = new MarkdownString();

			contents.appendText(`${ctx.word}: ${flatten(data.type, ' | ')}`);
			contents.appendMarkdown('\n\n---\n\n');
			contents.appendText(data.desc);
			if (data.examples) {
				let mk = '\n\n---\n\n';
				mk += 'Examples:\n';
				for (const ex of data.examples) {
					mk += ` - ${ex.replace('#', '\\#')}\n`;
				}
				contents.appendMarkdown(mk);
			}
			if (data.values) {
				let mk = '\n\n---\n\n';
				mk += 'Values:\n\n';
				for (const val of data.values) {
					mk += ` - ${val.replace('#', '\\#')}\n`;
				}
				mk += '\n';
				contents.appendMarkdown(mk);
			}

			let urlClassName = className;
			if (urlClassName.startsWith('q')) {
				urlClassName = urlClassName.slice(1);
				urlClassName = urlClassName.replace('btn', 'button');
				urlClassName = urlClassName.replace('img', 'image');
			}
			const url = `https://quasar.dev/vue-components/${urlClassName}`;

			contents.appendMarkdown(`\n\n[${url}](${url})`);

			const hover = new Hover(contents);
			return hover;
		}

		return undefined;
	}
}
