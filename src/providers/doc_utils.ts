import type { Position, TextDocument, Range } from 'vscode';
import { type JSONObject, type JSONValue, quasarData, quasarLists, tailwindClasses } from './data';
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
