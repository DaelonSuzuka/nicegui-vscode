# NiceGUI extension for Visual Studio Code

A Visual Studio Code extension with rich support for the [NiceGUI](https://nicegui.io) UI framework.

### Features
- syntax highlighting for embedded HTML/CSS strings
- completions for Tailwind/CSS in `.classes()` method
- completions for CSS properties and common values in `.style()` method
- completions for Quasar props, events, methods, and slots
- completions for `ui.*` functions from installed NiceGUI
- hovers for Quasar attributes
- completions for icons
- NiceGUI snippets (`ngapp`, `ngpage`, `ngbutton`, `ngcard`, `ngrefresh`)

### Updating metadata for a new NiceGUI version

Run:

```bash
npm run sync:nicegui-data
```

This refreshes `assets/nicegui_functions.json` and `assets/nicegui_to_quasar_map.json` from your installed `nicegui` package.

### Updating Quasar metadata

If Quasar API files are available in either:
- `../quasar/ui/src` (legacy repo checkout), or
- `node_modules/quasar/dist/api` (npm package),

run:

```bash
npm run sync:quasar-data
```

You can also override the source path with `QUASAR_API_DIR=/path/to/api`.

## Screenshots

Tailwind Completions in `.classes()` method

![alt text](img/tailwind_completions.gif)

Icon completions + hovers

![alt text](img/icons.gif)

Quasar Completions

![alt text](img/props.png)
![alt text](img/events.png)
![alt text](img/methods.png)
![alt text](img/slots.png)

Syntax Highlighting for HTML/CSS strings

![alt text](img/syntax_highlighting.png)
