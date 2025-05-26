import * as vscode from 'vscode';
import { NiceGuiCompletionItemProvider, NiceGuiHoverProvider } from './providers';
import { createLogger, find_file, get_config, register_command, set_context } from './utils';

const log = createLogger('ext');

export function activate(context: vscode.ExtensionContext) {
	new NiceGuiCompletionItemProvider(context);
	new NiceGuiHoverProvider(context);

	context.subscriptions.push(
		register_command('switchScriptComponent', switch_script_component),
		register_command('openPreview', open_nicegui_preview),
	);

	set_context('niceguiComponentFiles', ['python', 'vue', 'javascript']);

	if (get_config().get('enableStringSuggestions')) {
		enable_string_suggestions();
	}
}

function enable_string_suggestions() {
	const setting = 'editor.quickSuggestions';
	const scope = { languageId: 'python' };

	const config = get_config('', scope);
	const currentValue = config.get(setting, {});
	const value = { ...currentValue, ...{ strings: 'on' } };
	config.update(setting, value, true);
}

export function deactivate() {
	//
}

async function switch_script_component() {
	const currentFile = vscode.window.activeTextEditor.document.uri.fsPath;
	let targetFile = '';
	if (currentFile.endsWith('.py')) {
		// TODO: also check for JS files somehow
		targetFile = currentFile.replace('.py', '.vue');
	} else if (currentFile.endsWith('.vue')) {
		targetFile = currentFile.replace('.vue', '.py');
	} else if (currentFile.endsWith('.js')) {
		targetFile = currentFile.replace('.js', '.py');
	}

	const file = await find_file(targetFile);
	if (file) {
		vscode.window.showTextDocument(file);
	}
}

async function open_nicegui_preview() {
	const options = {
		enableScripts: true,
		retainContextWhenHidden: true,
	};
	const panel = vscode.window.createWebviewPanel('nicegui', 'NiceGUI', vscode.ViewColumn.Active, options);

	const url = get_config().get('preview.url');

	const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>NiceGUI</title>
</head>
<body>
    <object data="${url}" style="width:100%;height:100vh;">
        <embed src="${url}" style="width:100%;height:100vh;"> </embed>
        Error: Embedded data could not be displayed.
    </object>
</body>
</html>`;
	panel.webview.html = html;
}
