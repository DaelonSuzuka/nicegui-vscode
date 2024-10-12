import * as vscode from "vscode";
import type {
	Position,
	TextDocument,
	CancellationToken,
	CompletionContext,
	CompletionItemProvider,
	ExtensionContext,
} from "vscode";
import { CompletionItem } from "vscode";
import tailwindClasses from "../../assets/tailwind_classes.json";
import { createLogger } from "../utils";

const log = createLogger("providers.tw");

export class NiceGuiCompletionItemProvider implements CompletionItemProvider {
	constructor(private context: ExtensionContext) {
		const selector = [{ language: "python", scheme: "file" }];

		context.subscriptions.push(
			vscode.languages.registerCompletionItemProvider(selector, this),
		);
	}

	async provideCompletionItems(
		document: TextDocument,
		position: Position,
		token: CancellationToken,
		context: CompletionContext,
	): Promise<
		vscode.CompletionItem[] | vscode.CompletionList<vscode.CompletionItem>
	> {
		log.debug("provideCompletionItems");

		// get the entire line up until the cursor
		const linePrefix = document
			.lineAt(position)
			.text.slice(0, position.character);
		log.debug("linePrefix", linePrefix);

		// look backwards for ".classes("
		const result = linePrefix.match(
			/.(props|classes|style)\s*\([\"'](?:(?:\b[\w-]+\b)?\s*?)+$/,
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
			case "props":
				log.debug("props");
				break;
			case "classes":
				log.debug("classes");
				for (const tw of tailwindClasses) {
					if (word === "") {
						items.push(new CompletionItem(tw));
					} else if (tw.startsWith(word)) {
						const item = new CompletionItem(tw);
						item.range = wordRange;
						items.push(item);
					}
				}
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
