import * as fs from 'node:fs';
import * as path from 'node:path';
import * as vscode from 'vscode';

export * from './logger';

export const EXTENSION_AUTHOR = 'DaelonSuzuka';
export const EXTENSION_PREFIX = 'nicegui';

export function get_config(section = EXTENSION_PREFIX, scope?: vscode.ConfigurationScope | null) {
	return vscode.workspace.getConfiguration(section, scope);
}

export function is_debug_mode(): boolean {
	return process.env.VSCODE_DEBUG_MODE === 'true';
}

const CONTEXT_PREFIX = `${EXTENSION_PREFIX}.context.`;

export function set_context(name: string, value: any) {
	return vscode.commands.executeCommand('setContext', CONTEXT_PREFIX + name, value);
}

export function register_command(command: string, callback: (...args: any[]) => any, thisArg?: any) {
	return vscode.commands.registerCommand(`${EXTENSION_PREFIX}.${command}`, callback, thisArg);
}

export function get_extension_uri(...paths: string[]) {
	return vscode.Uri.joinPath(vscode.extensions.getExtension(`${EXTENSION_AUTHOR}.${EXTENSION_PREFIX}`).extensionUri, ...(paths ?? ''));
}

export async function find_file(file: string): Promise<vscode.Uri | null> {
	if (fs.existsSync(file)) {
		return vscode.Uri.file(file);
	}
	const fileName = path.basename(file);
	const results = await vscode.workspace.findFiles(`**/${fileName}`, null);
	if (results.length === 1) {
		return results[0];
	}

	return null;
}
