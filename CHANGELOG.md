# Changelog

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
