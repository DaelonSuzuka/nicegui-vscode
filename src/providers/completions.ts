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

		// get the full word from under the cursor
		const wordRange = document.getWordRangeAtPosition(position, /\b[\w-]+\b|([\"'])\1/);
		const word = document.getText(wordRange);

		log.debug("word", word);

        if (result[1] === "props") {
            log.debug("props");
        }
		if (result[1] === "classes") {
            log.debug("classes");
			for (const tw of tailwindClasses) {
				if (tw.startsWith(word)) {
					const item = new CompletionItem(tw);
					item.range = wordRange;
					items.push(item);
				}
			}
		}
		if (result[1] === "style") {
            log.debug("style");
		}

		log.debug("found ", items);
		return items;
	}
}
