import * as fs from 'node:fs';
import * as vscode from 'vscode';

function get_extension_uri(...paths: string[]) {
	return vscode.Uri.joinPath(vscode.extensions.getExtension('DaelonSuzuka.nicegui').extensionUri, ...(paths ?? ''));
}

function load(file: string) {
	const uri = get_extension_uri('assets', file);
	return JSON.parse(fs.readFileSync(uri.fsPath).toString());
}

export function flatten(item: string | string[] | JSONValue, join: string): string {
	if (typeof item === 'string') {
		return item;
	}
	if (Array.isArray(item)) {
		return item.join(join);
	}
}

// JSON types taken from https://github.com/microsoft/TypeScript/issues/1897#issuecomment-822032151
export type JSONValue = string | number | boolean | null | JSONValue[] | { [key: string]: JSONValue };
export interface JSONObject {
	[k: string]: JSONValue;
}

export interface QuasarAttribute {
	extends?: string;
	default?: string;
	type?: string;
	tsType?: string;
	desc?: string;
	values?: string[];
	examples?: string[];
	category?: string;
	internal?: boolean;
	params?: JSONObject;
	returns?: JSONObject;
}

// might not be an exhaustive type
export interface QuasarComponent {
	internal?: boolean;
	mixins?: string[];
	meta?: JSONObject;
	quasarConfOptions?: JSONObject;
	injection?: string;
	methods?: { [k: string]: QuasarAttribute };
	props?: { [k: string]: QuasarAttribute };
	events?: { [k: string]: QuasarAttribute };
	slots?: { [k: string]: QuasarAttribute };
}

export interface QuasarComponentList {
	[k: string]: QuasarComponent;
}

export const quasarData: QuasarComponentList = load('quasar_components.json');

export interface QuasarGenericLists {
	props: string[];
	events: string[];
	slots: string[];
	methods: string[];
}

export const quasarLists: QuasarGenericLists = load('quasar_lists.json');
export const tailwindClasses: string[] = load('tailwind_classes.json');

export const defaultIcons: string[] = load('default_icons.json')
