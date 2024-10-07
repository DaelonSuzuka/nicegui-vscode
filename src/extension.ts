import type * as vscode from "vscode";
import {
	NiceGuiCompletionItemProvider
} from "./providers";


export function activate(context: vscode.ExtensionContext) {
    console.log('wtf');
    new NiceGuiCompletionItemProvider(context);
}

export function deactivate() {

}