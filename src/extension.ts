import type * as vscode from "vscode";
import {
	TailwindCompletionItemProvider
} from "./providers";


export function activate(context: vscode.ExtensionContext) {
    console.log('wtf');
    new TailwindCompletionItemProvider(context);
}

export function deactivate() {

}