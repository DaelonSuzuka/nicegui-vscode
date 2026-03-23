# Changelog

### 0.10.0

- Versioning update: bumped release version to `0.10.0` and corrected/consolidated interim version steps from this fork (`0.9.7`-`0.9.9`) into this release.
- Fix Pylance connection race in hover/completion integration (avoid `_connection` null crash during startup)
- Improve provider resilience:
  - add cancellation checks and guarded fallbacks in completion/hover providers
  - avoid provider hard-fail on transient errors
- Reduce CPU and memory spikes in completions:
  - cap maximum completion items returned for large lists (icons, tailwind, generic values, `ui.*`)
  - mark truncated completion responses as `isIncomplete` so VS Code requests fresh suggestions while typing
  - add bounded caches for repeated completion item lists and Pylance class/hover lookups
  - reduce document context scan window in hot paths
- Add new performance settings:
  - `nicegui.performance.maxGeneralCompletions`
  - `nicegui.performance.maxIconCompletions`
  - `nicegui.performance.maxTailwindCompletions`
  - `nicegui.performance.maxIconValueCompletions`
  - `nicegui.performance.maxAttributeValueCompletions`
  - `nicegui.performance.maxFunctionCompletions`
  - `nicegui.performance.enableCompletionTimingLog`
  - `nicegui.performance.completionTimingLogThresholdMs`
- Improve preview and command robustness:
  - reuse preview webview panel instead of creating many retained panels
  - validate preview URL
  - guard against missing active editor in switch command
- Dev/debug quality:
  - fix extension launch config to use the existing workspace file (`nicegui3.code-workspace`)
- Fix extension activation crash: `Cannot read properties of undefined (reading 'extensionUri')`
- Fix asset loading path resolution to support both build layouts:
  - TypeScript output (`out/providers/*.js`)
  - esbuild bundle output (`out/extension.js`)
- Fix startup error when loading metadata files (`ENOENT ... out/assets/quasar_components.json`)
- Restore props/classes/style suggestions by removing an over-restrictive Pylance hover gate in completions
- Add compatibility improvements for NiceGUI 3.7.1 and newer Pylance hover response formats
- Fix hover/completion crash caused by null hover payloads (`Cannot read properties of null (reading 'match')`)
- Add auto-generated NiceGUI metadata pipeline (`tools/gather_nicegui_data.py`) and new assets for:
  - `ui.*` function completions
  - explicit NiceGUI class to Quasar component mapping
- Improve class resolution by preferring generated NiceGUI->Quasar mapping before fallback name conversion
- Update Quasar metadata to Quasar 2.18.5 and make metadata generation support both:
  - legacy `../quasar/ui/src`
  - npm `node_modules/quasar/dist/api` (or `QUASAR_API_DIR`)
- Add `.style()` completions (CSS properties and common values)
- Extend completion context detection to also support:
  - `default_props(...)`
  - `default_classes(...)`
  - `default_style(...)` and `default_styles(...)`
- Add NiceGUI snippets (`ngapp`, `ngpage`, `ngbutton`, `ngcard`, `ngrefresh`)
- Add maintenance scripts:
  - `npm run sync:nicegui-data`
  - `npm run sync:quasar-data`

### 0.9.5

- Replace icon list generator with new one provided by @evnchn (thanks!)

### 0.9.4

- Fix typo in icon generation script

### 0.9.3

- Improve icon list for completions

### 0.9.2

- Add alt+o shortcut to jump from a .py file to a matching .vue file

### 0.9.1

- Remove leftover debugging code
  
### 0.9.0

- Improved completions for Quasar attributes with examples/fixed values
- Implemented completions for icons

### 0.8.0

- Implement Quasar attribute hover provider

### 0.7.0

- Fix completions not triggering when . or / are in tailwind classes
- Improve completion rules to support situations like `ui.row().classes(add='w-full  ', remove='w-', replace="w")`
- Update quasar data

### 0.6.1

- Fix suggestion setting being written to the wrong place

### 0.6.0

- Feature: Improve display of prop suggestions
- Feature: Add JS function signatures to event and method suggestions
- Feature: When choosing a slot suggestion, automatically move selection to template section (ex: header-cell-[name])
- Feature: Automatically enable suggestions in strings (prevents https://github.com/DaelonSuzuka/nicegui-vscode/issues/1)
- Feature: Add empty snippets.json file (please send me your snippet ideas!)
- Fix highlighting of slot names
- Fix instance where a newline prevented slot name suggestions
  
### 0.5.0

- Feature: Enable completions for Quasar props, events, methods, and slots

### 0.4.0

- Enable Tailwind completions in .classes() method
