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
	// biome-ignore lint/suspicious/noExplicitAny: <vscode API?>
	pylance: vscode.Extension<any>;

	constructor(private context: ExtensionContext) {
		const selector = [{ language: "python", scheme: "file" }];

		this.pylance = vscode.extensions.getExtension("ms-python.vscode-pylance");

		this.context.subscriptions.push(vscode.languages.registerCompletionItemProvider(selector, this));
	}

	async provideCompletionItems(
		document: TextDocument,
		position: Position,
		token: CancellationToken,
		context: CompletionContext,
	): Promise<CompletionItem[] | CompletionList<CompletionItem>> {
		// log.debug("provideCompletionItems");

		// get the entire line up until the cursor
		const linePrefix = document.lineAt(position).text.slice(0, position.character);
		// log.debug("linePrefix", linePrefix);

		// look backwards for ".classes("
		const result = linePrefix.match(/.(props|classes|style|on|run_method|add_slot)\s*\([\"'](?:(?:\b[\w-]+\b)?\s*?)+$/);

		if (!result) {
			return undefined;
		}

		// get the range of the word from under the cursor
		const wordRange = document.getWordRangeAtPosition(position, /\b[\w-]+\b|([\"'])\1/);

		// convert the range into the actual word
		let word = "";
		if (wordRange !== undefined) {
			word = document.getText(wordRange);
			if (['""', "''"].includes(word)) {
				word = "";
			}
		}

		// ironically, "classes" doesn't rely on knowing the class
		if (result[1] === "classes") {
			return build_completions(tailwindClasses, word, wordRange);
		}

		let className: string = null;

		if (this.pylance?.isActive) {
			const client = await this.pylance.exports.client.getClient();

			const offset = document.offsetAt(position);
			const hoverPosition = document.positionAt(
				offset - (result[0].length - 1),
			);

			const response = await client._connection.sendRequest(
				"textDocument/hover",
				{
					textDocument: { uri: document.uri.toString() },
					position: {
						line: hoverPosition.line,
						character: hoverPosition.character,
					},
				},
			);
			const body = response.contents.value;

			let possibleClass = "";

			if (["classes", "props", "style"].includes(result[1])) {
				possibleClass = body.match(
					/\(property\) (?:classes|props|style): (?:Classes|Props|Style)\[(?:Self@)?([\w_]+)\]/,
				);
			} else if (["on"].includes(result[1])) {
				possibleClass = body.match(/\(method\) def on\([^\)]*\) -> (\w+)/m);
			}

			if (possibleClass) {
				className = `Q${possibleClass[1]}`;
				// Convert NiceGUI types to Quasar types
				className = className.replace("Button", "Btn");
				className = className.replace("Image", "Img");
			}
		}

		// log.debug("className", className);

		function build_item(name, data) {
			const item = new CompletionItem(name);
			if (typeof data.type === "string") {
				item.detail = data.type;
			} else if (Array.isArray(data.type)) {
				item.detail = data.type.join(" | ");
			}
			item.documentation = data.desc;
			if (word !== "") {
				item.range = wordRange;
			}
			return item;
		}

		const items = [];

		if (className) {
			log.debug("using quasar metadata");
			const classData = quasarInfo[className];
			switch (result[1]) {
				case "props":
					for (const [name, body] of Object.entries(classData.props ?? {})) {
						if (word === "" || name.includes(word)) {
							const item = build_item(name, body);
							items.push(item);
						}
					}
					break;
				case "add_slot":
					for (const [name, body] of Object.entries(classData.slots ?? {})) {
						if (word === "" || name.includes(word)) {
							const item = build_item(name, body);
							items.push(item);
						}
					}
					break;
				case "on":
					for (const [name, body] of Object.entries(classData.events ?? {})) {
						if (word === "" || name.includes(word)) {
							const item = build_item(name, body);
							items.push(item);
						}
					}
					break;
				case "run_method":
					for (const [name, body] of Object.entries(classData.methods ?? {})) {
						if (word === "" || name.includes(word)) {
							const item = build_item(name, body);
							items.push(item);
						}
					}
					break;
				case "style":
					// log.debug("style");
					break;

				default:
					break;
			}
		} else {
			log.debug("using full lists");
			switch (result[1]) {
				case "props":
					items.push(...build_completions(quasarProps, word, wordRange));
					break;
				case "add_slot":
					items.push(...build_completions(quasarSlots, word, wordRange));
					break;
				case "on":
					items.push(...build_completions(quasarEvents, word, wordRange));
					break;
				case "run_method":
					items.push(...build_completions(quasarMethods, word, wordRange));
					break;
				case "style":
					// log.debug("style");
					break;
				default:
					break;
			}
		}

		// log.debug("found ", items.length);
		return items;
	}
}
