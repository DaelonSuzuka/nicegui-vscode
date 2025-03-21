import * as vscode from 'vscode';
import { Position, TextDocument } from 'vscode';

export interface TextDocumentPositionParams {
	textDocument: { uri: string };
	position: Position;
}

export class PylanceAdapter {
	pylance = vscode.extensions.getExtension('ms-python.vscode-pylance');

	async get_client() {
		if (!this.pylance?.isActive) {
			return null;
		}
		return await this.pylance.exports.client.getClient();
	}

	async send_request(method: string, params) {
		if (!this.pylance?.isActive) {
			return null;
		}
		const client = await this.pylance.exports.client.getClient();

		return await client._connection.sendRequest(method, params);
	}

	async request_hover(document: TextDocument, position: Position): Promise<string | null> {
		const location: TextDocumentPositionParams = {
			textDocument: { uri: document.uri.toString() },
			position: position,
		};
		const response = await this.send_request('textDocument/hover', location);
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
		return response;
	}

	async determine_class(document: TextDocument, kind: string, offset: number): Promise<string | null> {
		const possibleClass = await this._determine_class(document, kind, offset);
		let className = null;
		if (possibleClass) {
			// Convert NiceGUI types to Quasar types
			className = `Q${possibleClass}`;
			className = className.replace('Button', 'Btn');
			className = className.replace('Image', 'Img');
			className = className.toLowerCase();
		}
		return className;
	}

	async _determine_class(document: TextDocument, kind: string, offset: number) {
		if (['classes', 'props', 'style', 'events'].includes(kind)) {
			const body = await this.request_hover(document, document.positionAt(offset + 1));
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
	}
}
