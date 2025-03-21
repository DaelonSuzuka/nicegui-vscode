import type { Position, Range, TextDocument } from 'vscode';
import { createLogger } from '../utils';

const log = createLogger('doc_utils');

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

export type ContextMethod = 'classes' | 'props' | 'slots' | 'events' | 'methods' | 'style';

export interface DocumentContext {
	document: TextDocument;
	position: Position;
	result: RegExpMatchArray | null; // TODO: bad name
	method: string;
	kind: ContextMethod;
	surroundRange: Range;
	surround: string;
	wordRange: Range;
	word: string;
	className?: string;
}

const kinds = {
	classes: 'classes',
	props: 'props',
	add_slot: 'slots',
	on: 'events',
	run_method: 'methods',
	style: 'style',
};

export function capture_document_context(document: TextDocument, position: Position) {
	const prefix = document.getText().slice(0, document.offsetAt(position));
	const result = prefix.match(/\.\s*(props|classes|style|on|run_method|add_slot)\s*\(\s*[^\)]+$/);

	if (!result) {
		return undefined;
	}

	const surroundPattern = /(?<=(["']))(?:(?=(\\?))\2.)*?(?=\1)/;
	const surroundRange = document.getWordRangeAtPosition(position, surroundPattern);
	const surround = get_word_at_position(document, position, surroundPattern);

	const wordPattern = /[\.\w\/-]+\=?|([\"'])\1/;
	const wordRange = document.getWordRangeAtPosition(position, wordPattern);
	const word = get_word_at_range(document, wordRange) ?? '';

	const kind = kinds[result[1]];

	const context: DocumentContext = {
		document: document,
		position: position,
		result: result,
		method: result[1],
		surroundRange: surroundRange,
		surround: surround,
		wordRange: wordRange,
		word: word,
		kind: kind,
	};

	return context;
}
