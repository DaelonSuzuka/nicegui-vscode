import * as vscode from 'vscode';
import {
	Uri,
	Position,
	TextDocument,
	CancellationToken,
	ExtensionContext,
	HoverProvider,
	MarkdownString,
	Hover,
} from 'vscode';
import { createLogger } from '../utils';

const log = createLogger('providers.hover');

export class NiceGuiHoverProvider implements HoverProvider {
	constructor(private context: ExtensionContext) {
		const selector = [{ language: 'python', scheme: 'file' }];
		context.subscriptions.push(vscode.languages.registerHoverProvider(selector, this));
	}

	async provideHover(document: TextDocument, position: Position, token: CancellationToken): Promise<Hover> {
		log.debug('provideHover');

		const contents = new MarkdownString();

		const hover = new Hover(contents);
		return hover;
	}
}
