import * as vscode from 'vscode';
import { Position, TextDocument } from 'vscode';
import { niceguiToQuasarMap } from './data';

export interface TextDocumentPositionParams {
	textDocument: { uri: string };
	position: Position;
}

interface PylanceConnection {
	sendRequest(method: string, params: unknown): Promise<unknown>;
}

export class PylanceAdapter {
	pylance = vscode.extensions.getExtension('ms-python.vscode-pylance');
	private hoverCache = new Map<string, string | null>();
	private classCache = new Map<string, string | null>();
	private readonly hoverCacheLimit = 512;
	private readonly classCacheLimit = 512;

	private set_bounded_cache<T>(cache: Map<string, T>, key: string, value: T, maxSize: number) {
		if (cache.has(key)) {
			cache.delete(key);
		}
		cache.set(key, value);
		if (cache.size > maxSize) {
			const firstKey = cache.keys().next().value;
			if (firstKey !== undefined) {
				cache.delete(firstKey);
			}
		}
	}

	private normalize_hover_contents(contents: unknown): string | null {
		if (!contents) {
			return null;
		}
		if (typeof contents === 'string') {
			return contents;
		}
		if (Array.isArray(contents)) {
			const parts: string[] = [];
			for (const part of contents) {
				if (typeof part === 'string') {
					parts.push(part);
					continue;
				}
				if (
					part !== null &&
					typeof part === 'object' &&
					'value' in part &&
					typeof (part as { value: unknown }).value === 'string'
				) {
					parts.push((part as { value: string }).value);
				}
			}
			return parts.length > 0 ? parts.join('\n') : null;
		}
		if (
			contents !== null &&
			typeof contents === 'object' &&
			'value' in contents &&
			typeof (contents as { value: unknown }).value === 'string'
		) {
			return (contents as { value: string }).value;
		}
		return null;
	}

	private first_match(body: string, patterns: RegExp[]): string | null {
		for (const pattern of patterns) {
			const match = body.match(pattern);
			if (match?.[1]) {
				return match[1];
			}
		}
		return null;
	}

	async get_client() {
		if (!this.pylance) {
			return null;
		}
		try {
			if (!this.pylance.isActive) {
				await this.pylance.activate();
			}
			return await this.pylance.exports?.client?.getClient?.();
		} catch {
			return null;
		}
	}

	private async get_connection(): Promise<PylanceConnection | null> {
		const client = await this.get_client();
		const connection = client?._connection;
		if (!connection || typeof connection.sendRequest !== 'function') {
			return null;
		}
		return connection;
	}

	async send_request(method: string, params) {
		const connection = await this.get_connection();
		if (!connection) {
			return null;
		}
		try {
			return await connection.sendRequest(method, params);
		} catch {
			return null;
		}
	}

	async request_hover(document: TextDocument, position: Position): Promise<string | null> {
		const cacheKey = `${document.uri.toString()}#${document.version}:${position.line}:${position.character}`;
		if (this.hoverCache.has(cacheKey)) {
			return this.hoverCache.get(cacheKey) ?? null;
		}

		const location: TextDocumentPositionParams = {
			textDocument: { uri: document.uri.toString() },
			position: position,
		};
		const response = (await this.send_request('textDocument/hover', location)) as { contents?: unknown } | null;
		const normalized = this.normalize_hover_contents(response?.contents);
		this.set_bounded_cache(this.hoverCache, cacheKey, normalized, this.hoverCacheLimit);
		return normalized;
	}

	async request_type(document: TextDocument, position: Position): Promise<string | null> {
		const connection = await this.get_connection();
		if (!connection) {
			return null;
		}
		try {
			const response = await connection.sendRequest('textDocument/typeDefinition', {
				textDocument: { uri: document.uri.toString() },
				position: {
					line: position.line,
					character: position.character,
				},
			});
			return response as string | null;
		} catch {
			return null;
		}
	}

	async determine_class(document: TextDocument, kind: string, offset: number): Promise<string | null> {
		const cacheKey = `${document.uri.toString()}#${document.version}:${kind}:${offset}`;
		if (this.classCache.has(cacheKey)) {
			return this.classCache.get(cacheKey) ?? null;
		}

		const possibleClass = await this._determine_class(document, kind, offset);
		if (!possibleClass) {
			this.set_bounded_cache(this.classCache, cacheKey, null, this.classCacheLimit);
			return null;
		}

		// Prefer exact mappings extracted from installed NiceGUI.
		const mappedClass = niceguiToQuasarMap[possibleClass];
		if (mappedClass) {
			this.set_bounded_cache(this.classCache, cacheKey, mappedClass, this.classCacheLimit);
			return mappedClass;
		}

		// Fallback for unmapped classes.
		let className = `Q${possibleClass}`;
		className = className.replace('Button', 'Btn');
		className = className.replace('Image', 'Img');
		const normalized = className.toLowerCase();
		this.set_bounded_cache(this.classCache, cacheKey, normalized, this.classCacheLimit);
		return normalized;
	}

	async _determine_class(document: TextDocument, kind: string, offset: number) {
		if (['classes', 'props', 'style', 'events'].includes(kind)) {
			const body = await this.request_hover(document, document.positionAt(offset + 1));
			if (!body) {
				return null;
			}
			if (['classes', 'props', 'style'].includes(kind)) {
				return this.first_match(body, [
					/\(property\)\s+(?:classes|props|style):\s+(?:Classes|Props|Style)\[(?:Self@)?([\w_]+)\]/,
					/(?:classes|props|style):\s+(?:Classes|Props|Style)\[(?:Self@)?([\w_]+)\]/,
					/(?:classes|props|style):\s+\w*\[(?:Self@)?([\w_]+)\]/,
				]);
			}
			if (['events'].includes(kind)) {
				return this.first_match(body, [
					/\(method\)\s+def on\([^\)]*\)\s*->\s*([\w_]+)/m,
					/def on\([^\)]*\)\s*->\s*([\w_]+)/m,
				]);
			}
		}

		// TODO: fix this awful mess
		const body1 = await this.request_hover(document, document.positionAt(offset - 1));
		// log.debug("body1", body1);
		if (body1) {
			const variableClass = this.first_match(body1, [
				/\(variable\)\s+[\w_]*:\s+([\w_]+)/,
				/\(variable\)\s+[\w_]*:\s+[\w_]+\[([\w_]+)\]/,
				/:\s+([\w_]+)$/,
			]);
			// log.debug("match1", match);
			if (variableClass) {
				return variableClass;
			}
		}

		const body2 = await this.request_hover(document, document.positionAt(offset - 3));
		// log.debug("body2", body2);
		if (body2) {
			const classMatch = this.first_match(body2, [
				/class\s+([\w_]+)\(/,
				/->\s+([\w_]+)/,
			]);
			// log.debug("match2", match);
			if (classMatch) {
				return classMatch;
			}
		}
		return null;
	}
}
