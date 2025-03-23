import * as path from 'node:path';
import * as fs from 'node:fs';
import * as glob from 'glob';

const quasarPath = process.argv[2];

async function run() {
	if (quasarPath === undefined) {
		console.log('Please provide the absolute path to your Quasar repo');
		return;
	}
	const original_cwd = process.cwd();

	const iconDir = path.join(quasarPath, 'ui', 'icon-set');

	process.chdir(iconDir);
	const files = await glob.glob('material*.js');
	// console.log(files);

	const modules: any[] = [];

	for (const f of files) {
		const data = fs.readFileSync(f).toString();
		const mod = await import(`data:text/javascript,${data}`);
		modules.push(mod);
	}
	// console.log(modules);

	const iconNames = new Set<string>();

	for (const mod of modules) {
		for (const [key, value] of Object.entries(mod.default)) {
			if (value && typeof value === 'object') {
				for (const name of Object.values(value)) {
					iconNames.add(name);
				}
			}
		}
	}
	// console.log(iconNames);

	process.chdir(original_cwd);

	const sortedNames = Array.from(iconNames).sort();
	const output = JSON.stringify(sortedNames, null, 4);
	fs.writeFileSync('./assets/default_icons.json', output);
}

run();
