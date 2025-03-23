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

		// const location = {
		// 	textDocument: { uri: document.uri.toString() },
		// 	position: {
		// 		line: position.line,
		// 		character: position.character,
		// 	},
		// };

		// const r = await this.pylance.send_request('textDocument/documentSymbol', location);
		// log.debug('textDocument/documentSymbol:', r);

		// const i = await this.pylance.send_request('textDocument/implementation', location);
		// log.debug('textDocument/implementation:', i);

		// const d = await this.pylance.send_request('textDocument/declaration', location);
		// log.debug('textDocument/declaration:', d);

		// const result = await this.pylance.request_type(document, position);
		// log.debug('type:', result);

		// if (result?.length > 0) {
		// 	// log.debug(result[0]);
		// 	const range = new vscode.Range(result[0].range.start, result[0].range.end);
		// 	const uri = vscode.Uri.parse(result[0].uri);

		// 	if (fs.existsSync(uri.fsPath)) {
		// 		// log.debug('uri:', uri);
		// 		const origin = await vscode.workspace.openTextDocument(uri);
		// 		log.debug('origin:', origin);
		// 		const definition = origin.lineAt(range.start.line);

		// 		log.debug('definition:', definition.text);
		// 	}
		// }

		const ctx = capture_document_context(document, position);
		// log.debug('context:', ctx);

		if (!ctx) {
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

		const word = ctx.word.split('=')[0];
		const data = classData?.[ctx.kind]?.[word];
		// log.debug('data:', data);

		if (data) {
			const contents = new MarkdownString();

			contents.appendText(`${word}: ${flatten(data.type, ' | ')}`);
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
