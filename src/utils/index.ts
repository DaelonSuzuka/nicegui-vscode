import * as vscode from 'vscode';

export * from './logger';

export const EXTENSION_PREFIX = 'nicegui';

export function get_config(section = EXTENSION_PREFIX, scope?: vscode.ConfigurationScope | null) {
	return vscode.workspace.getConfiguration(section, scope);
}

export function is_debug_mode(): boolean {
	return process.env.VSCODE_DEBUG_MODE === 'true';
}
