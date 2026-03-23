import * as fs from 'node:fs';
import * as path from 'node:path';

function get_asset_path(file: string) {
	// Support both build layouts:
	// 1) tsc output: out/providers/data.js  -> ../../assets
	// 2) esbuild bundle: out/extension.js  -> ../assets
	const candidates = [
		path.resolve(__dirname, '..', '..', 'assets', file),
		path.resolve(__dirname, '..', 'assets', file),
	];
	for (const candidate of candidates) {
		if (fs.existsSync(candidate)) {
			return candidate;
		}
	}
	return candidates[0];
}

function load<T>(file: string, fallback: T): T {
	const assetPath = get_asset_path(file);
	try {
		const raw = fs.readFileSync(assetPath, 'utf-8');
		return JSON.parse(raw) as T;
	} catch (error) {
		console.error(`[NiceGUI] Failed to load asset "${file}" from "${assetPath}"`, error);
		return fallback;
	}
}

export function flatten(item: string | string[] | JSONValue, join: string): string {
	if (item === null || item === undefined) {
		return '';
	}
	if (typeof item === 'string') {
		return item;
	}
	if (Array.isArray(item)) {
		return item.map(String).join(join);
	}
	return String(item);
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

export const quasarData: QuasarComponentList = load<QuasarComponentList>('quasar_components.json', {});

export interface QuasarGenericLists {
	props: string[];
	events: string[];
	slots: string[];
	methods: string[];
}

export const quasarLists: QuasarGenericLists = load<QuasarGenericLists>('quasar_lists.json', {
	props: [],
	events: [],
	slots: [],
	methods: [],
});
export const tailwindClasses: string[] = load<string[]>('tailwind_classes.json', []);
export const niceguiFunctions: string[] = load<string[]>('nicegui_functions.json', []);
export const niceguiToQuasarMap: { [k: string]: string } = load<{ [k: string]: string }>(
	'nicegui_to_quasar_map.json',
	{},
);

export const materialIcons: string[] = load<string[]>('material_icons.json', []);
