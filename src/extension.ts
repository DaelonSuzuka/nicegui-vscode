import type * as vscode from "vscode";
import {
	NiceGuiCompletionItemProvider
} from "./providers";


export function activate(context: vscode.ExtensionContext) {
    new NiceGuiCompletionItemProvider(context);
}

export function deactivate() {

}