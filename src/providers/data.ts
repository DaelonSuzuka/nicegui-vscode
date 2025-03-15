import * as vscode from 'vscode';
import * as fs from 'node:fs';

// JSON types taken from https://github.com/microsoft/TypeScript/issues/1897#issuecomment-822032151
export type JSONValue = string | number | boolean | null | JSONValue[] | { [key: string]: JSONValue };
export interface JSONObject {
	[k: string]: JSONValue;
}
interface JSONArray extends Array<JSONValue> {}

// might not be an exhaustive type
export interface QuasarComponent {
	internal?: boolean;
	mixins?: string[];
	meta?: JSONObject;
	quasarConfOptions?: JSONObject;
	injection?: string;
	methods?: { [k: string]: JSONObject };
	props?: { [k: string]: JSONObject };
	events?: { [k: string]: JSONObject };
	slots?: { [k: string]: JSONObject };
}

export interface QuasarComponentList {
	[k: string]: QuasarComponent;
}

function get_extension_uri(...paths: string[]) {
	return vscode.Uri.joinPath(vscode.extensions.getExtension('DaelonSuzuka.nicegui').extensionUri, ...(paths ?? ''));
}

function load(file: string) {
	const uri = get_extension_uri('assets', file);
	return JSON.parse(fs.readFileSync(uri.fsPath).toString());
}

export const quasarData: QuasarComponentList = load('quasar_components.json');
export const quasarProps: string[] = load('quasar_props.json');
export const quasarEvents: string[] = load('quasar_events.json');
export const quasarMethods: string[] = load('quasar_methods.json');
export const quasarSlots: string[] = load('quasar_slots.json');
export const tailwindClasses: string[] = load('tailwind_classes.json');
