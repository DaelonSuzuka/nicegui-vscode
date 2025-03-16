import * as vscode from 'vscode';
import {
	CancellationToken,
	ExtensionContext,
	Hover,
	HoverProvider,
	MarkdownString,
	Position,
	TextDocument,
	Uri,
} from 'vscode';
import { createLogger } from '../utils';
import { get_word_at_position, get_word_at_range } from './doc_utils';

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
