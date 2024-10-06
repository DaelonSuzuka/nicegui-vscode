import * as vscode from "vscode";
import type {
	Position,
	TextDocument,
	CancellationToken,
	ProviderResult,
	CompletionContext,
	CompletionList,
	CompletionItemProvider,
	ExtensionContext,
} from "vscode";
import { CompletionItem } from "vscode";
import { createLogger } from "../utils";

const log = createLogger("providers.tw");

export class TailwindCompletionItemProvider implements CompletionItemProvider {
	constructor(private context: ExtensionContext) {
		const selector = [{ language: "python", scheme: "file" }];

		context.subscriptions.push(
			vscode.languages.registerCompletionItemProvider(selector, this),
		);
	}

	provideCompletionItems(
		document: TextDocument,
		position: Position,
		token: CancellationToken,
		context: CompletionContext,
	): ProviderResult<CompletionItem[] | CompletionList<CompletionItem>> {
		const items = [];

		const linePrefix = document
			.lineAt(position)
			.text.slice(0, position.character);

		// log.debug("provideCompletionItems");
		// log.debug("linePrefix", linePrefix);
		// log.debug("context", context);

		if (linePrefix.includes(".classes(")) {
			log.debug("inside classes()", linePrefix);
		}

		items.push(new CompletionItem("w-1/4"));
		items.push(new CompletionItem("w-1/2"));
		items.push(new CompletionItem("w-full"));
		items.push(new CompletionItem("h-1/4"));
		items.push(new CompletionItem("h-1/2"));
		items.push(new CompletionItem("h-full"));
		return items;
	}
}
