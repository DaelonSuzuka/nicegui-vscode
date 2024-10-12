import * as vscode from "vscode";
import type {
	Position,
	TextDocument,
	CancellationToken,
	CompletionContext,
	CompletionList,
	CompletionItemProvider,
	ExtensionContext,
	Range,
} from "vscode";
import { CompletionItem } from "vscode";
import tailwindClasses from "../../assets/tailwind_classes.json";
import quasarInfo from "../../assets/quasar_components.json";
import quasarProps from "../../assets/quasar_props.json";
import quasarEvents from "../../assets/quasar_events.json";
import quasarMethods from "../../assets/quasar_methods.json";
import quasarSlots from "../../assets/quasar_slots.json";

import { createLogger } from "../utils";

const log = createLogger("providers.tw");

function build_completions(list, word: string, wordRange: Range) {
	const items: CompletionItem[] = [];
	for (const possible of list) {
		if (word === "") {
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
	constructor(private context: ExtensionContext) {
		const selector = [{ language: "python", scheme: "file" }];

		this.context.subscriptions.push(
			vscode.languages.registerCompletionItemProvider(selector, this),
		);
	}

	async provideCompletionItems(
		document: TextDocument,
		position: Position,
		token: CancellationToken,
		context: CompletionContext,
	): Promise<CompletionItem[] | CompletionList<CompletionItem>> {
		log.debug("provideCompletionItems");

		// get the entire line up until the cursor
		const linePrefix = document
			.lineAt(position)
			.text.slice(0, position.character);
		log.debug("linePrefix", linePrefix);

		// look backwards for ".classes("
		const result = linePrefix.match(
			/.(props|classes|style|on|run_method|add_slot)\s*\([\"'](?:(?:\b[\w-]+\b)?\s*?)+$/,
		);

		log.debug("result", result);

		if (!result) {
			return undefined;
		}
		const items = [];

		// get the range of the word from under the cursor
		const wordRange = document.getWordRangeAtPosition(
			position,
			/\b[\w-]+\b|([\"'])\1/,
		);

		// convert the range into the actual word
		let word = "";
		if (wordRange !== undefined) {
			word = document.getText(wordRange);
			if (['""', "''"].includes(word)) {
				word = "";
			}
		}

		log.debug("word", word);

		switch (result[1]) {
			case "classes":
				log.debug("classes");
				items.push(...build_completions(tailwindClasses, word, wordRange));
				break;
			case "props":
				log.debug("props");
				items.push(...build_completions(quasarProps, word, wordRange));
				break;
			case "add_slot":
				log.debug("slots");
				items.push(...build_completions(quasarSlots, word, wordRange));
				break;
			case "on":
				log.debug("events");
				items.push(...build_completions(quasarEvents, word, wordRange));
				break;
			case "run_method":
				log.debug("methods");
				items.push(...build_completions(quasarMethods, word, wordRange));
				break;
			case "style":
				log.debug("style");
				break;

			default:
				break;
		}

		log.debug("found ", items);
		return items;
	}
}
