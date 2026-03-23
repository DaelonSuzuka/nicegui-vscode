import { Position, Range, type TextDocument } from 'vscode';
import { createLogger } from '../utils';

const log = createLogger('doc_utils');
const CONTEXT_LOOKBACK_CHARS = 4096;

export function get_word_at_range(document: TextDocument, range: Range) {
	let word = null;
	if (range !== undefined) {
		word = document.getText(range);
		if (['""', "''"].includes(word)) {
			word = '';
		}
	}
	return word;
}

export function get_word_at_position(document: TextDocument, position: Position, regex?: RegExp) {
	const range = document.getWordRangeAtPosition(position, regex);
	// log.debug("get_word_at_position", range, position, range.contains(position));
	return get_word_at_range(document, range);
}

export type ContextMethod = 'classes' | 'props' | 'slots' | 'events' | 'methods' | 'style' | 'icons';

export interface DocumentContext {
	document: TextDocument;
	position: Position;
	result: RegExpMatchArray | null; // TODO: bad name
	method: string | undefined;
	kind: ContextMethod;
	surroundRange: Range | undefined;
	surround: string | null;
	wordRange: Range;
	word: string;
	className?: string;
}

const kinds = {
	classes: 'classes',
	props: 'props',
	default_classes: 'classes',
	default_props: 'props',
	add_slot: 'slots',
	on: 'events',
	run_method: 'methods',
	style: 'style',
	default_style: 'style',
	default_styles: 'style',
};

export function capture_document_context(document: TextDocument, position: Position) {
	const offset = document.offsetAt(position);
	const startOffset = Math.max(0, offset - CONTEXT_LOOKBACK_CHARS);
	const prefix = document.getText(new Range(document.positionAt(startOffset), position));
	const result = prefix.match(
		/\.\s*(props|classes|style|on|run_method|add_slot|default_props|default_classes|default_style|default_styles)\s*\(\s*[^\)]+$/,
	);

	if (!result) {
		const icon = prefix.match(/(icon)=['"]\w*$/);
		if (!icon) {
			return undefined;
		}
	}

	const surroundPattern = /(?<=(["']))(?:(?=(\\?))\2.)*?(?=\1)/;
	const surroundRange = document.getWordRangeAtPosition(position, surroundPattern);
	const surround = get_word_at_position(document, position, surroundPattern);

	const wordPattern = /[\.\w\/-=]+|([\"'])\1/;
	const wordRange = document.getWordRangeAtPosition(position, wordPattern) ?? new Range(position, position);
	const word = get_word_at_range(document, wordRange) ?? '';

	const kind = kinds[result?.[1]] ?? 'icons';

	const context: DocumentContext = {
		document: document,
		position: position,
		result: result,
		method: result?.[1],
		surroundRange: surroundRange,
		surround: surround,
		wordRange: wordRange,
		word: word,
		kind: kind,
	};

	return context;
}
