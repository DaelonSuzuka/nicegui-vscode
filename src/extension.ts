import type * as vscode from 'vscode';
import { NiceGuiCompletionItemProvider } from './providers';
import { createLogger, get_config } from './utils';

const log = createLogger('ext');

export function activate(context: vscode.ExtensionContext) {
	new NiceGuiCompletionItemProvider(context);

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
