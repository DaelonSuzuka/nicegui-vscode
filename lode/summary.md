# NiceGUI VSCode Extension

A VS Code extension providing rich language support for the NiceGUI Python UI framework. Features include syntax highlighting for embedded HTML/CSS, completions for Tailwind classes and Quasar props/events/methods/slots, hover documentation, and icon completions.

**Core Components:**
- **Extension Entry** (`src/extension.ts`) - Activates on Python language, registers providers and commands
- **Completion Provider** (`src/providers/completions.ts`) - Context-aware completions for Quasar attributes, Tailwind classes, icons
- **Hover Provider** (`src/providers/hover.ts`) - Documentation hovers for Quasar attributes
- **Pylance Adapter** (`src/providers/pylance.ts`) - Bridges to Pylance LSP for type inference

**Key Commands:**
- `nicegui.openPreview` - Opens embedded browser preview
- `nicegui.switchScriptComponent` - Toggles between .py/.vue/.js companion files (Alt+O)

**Data Sources** (`assets/`):
- `quasar_components.json` - Quasar component metadata (props, events, methods, slots)
- `quasar_lists.json` - Generic Quasar attribute lists (fallback when class unknown)
- `tailwind_classes.json` - Tailwind CSS class names
- `material_icons.json` - Material Design icon names