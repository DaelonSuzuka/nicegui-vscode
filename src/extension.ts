import * as vscode from 'vscode';
import { NiceGuiCompletionItemProvider, NiceGuiHoverProvider } from './providers';
import { createLogger, find_file, get_config, register_command, set_context } from './utils';

const log = createLogger('ext');
let previewPanel: vscode.WebviewPanel | undefined;

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
	const editor = vscode.window.activeTextEditor;
	if (!editor) {
		vscode.window.showInformationMessage('Open a Python/Vue/JS file first.');
		return;
	}

	const currentFile = editor.document.uri.fsPath;
	let targetFile = '';
	if (currentFile.endsWith('.py')) {
		// TODO: also check for JS files somehow
		targetFile = currentFile.replace('.py', '.vue');
	} else if (currentFile.endsWith('.vue')) {
		targetFile = currentFile.replace('.vue', '.py');
	} else if (currentFile.endsWith('.js')) {
		targetFile = currentFile.replace('.js', '.py');
	}

	if (!targetFile) {
		return;
	}

	const file = await find_file(targetFile);
	if (file) {
		await vscode.window.showTextDocument(file);
		return;
	}
	vscode.window.showWarningMessage(`Related file not found: ${targetFile}`);
}

async function open_nicegui_preview() {
	if (previewPanel) {
		previewPanel.reveal(vscode.ViewColumn.Active);
		return;
	}

	const configuredUrl = String(get_config().get('preview.url') ?? 'http://localhost:8080');
	let url = '';
	try {
		const parsedUrl = new URL(configuredUrl);
		if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
			throw new Error('Only http and https are supported');
		}
		url = parsedUrl.toString();
	} catch (error) {
		log.error('Invalid preview URL', error);
		vscode.window.showErrorMessage(`Invalid NiceGUI preview URL: ${configuredUrl}`);
		return;
	}

	const options = {
		enableScripts: true,
		retainContextWhenHidden: false,
	};
	const panel = vscode.window.createWebviewPanel('nicegui', 'NiceGUI', vscode.ViewColumn.Active, options);
	previewPanel = panel;
	panel.onDidDispose(() => {
		previewPanel = undefined;
	});

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
