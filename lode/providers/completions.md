# Completion Provider

**File:** `src/providers/completions.ts`

## Purpose
Provides context-aware completions for NiceGUI Python files, including:
- Tailwind CSS classes in `.classes()` method calls
- Quasar props, events, methods, and slots
- Material Design icons
- Prop value completions (enum choices)

## How It Works

```mermaid
sequenceDiagram
    participant Editor
    participant CompletionProvider
    participant PylanceAdapter
    participant doc_utils
    participant Data
    
    Editor->>CompletionProvider: provideCompletionItems()
    CompletionProvider->>PylanceAdapter: request_hover()
    alt Pylance has hover
        CompletionProvider-->>Editor: undefined (let Pylance handle)
    else No Pylance hover
        CompletionProvider->>doc_utils: capture_document_context()
        doc_utils-->>CompletionProvider: context (kind, word, wordRange)
        
        alt context.kind == "icons"
            CompletionProvider->>Data: materialIcons
            CompletionProvider-->>Editor: icon completions
        else context.kind == "classes"
            CompletionProvider->>Data: tailwindClasses
            CompletionProvider-->>Editor: Tailwind completions
        else props/events/methods/slots
            CompletionProvider->>PylanceAdapter: determine_class()
            PylanceAdapter-->>CompletionProvider: className
            alt className in quasarData
                CompletionProvider->>Data: quasarData[className][kind]
            else fallback
                CompletionProvider->>Data: quasarLists[kind]
            end
            CompletionProvider-->>Editor: attribute completions
        end
    end
```

## Key Functions

### `build_completions(list, word, wordRange)`
Filters completion list by partial word match. Returns all items if word is empty.

### `build_item(name, attr)`
Constructs a `CompletionItem` with:
- Label with type signature (for methods)
- Snippet insert text (for slots with placeholders, props with values)
- Markdown documentation with examples and value choices

## Context Kinds Handled

| Kind | Source | Behavior |
|------|--------|----------|
| `icons` | `material_icons.json` | Direct icon name completions |
| `classes` | `tailwind_classes.json` | Tailwind class completions |
| `props` | `quasar_components.json` or `quasar_lists.json` | Prop names with value snippets |
| `events` | `quasar_components.json` or `quasar_lists.json` | Event handler names |
| `methods` | `quasar_components.json` or `quasar_lists.json` | Method signatures |
| `slots` | `quasar_components.json` or `quasar_lists.json` | Slot names with snippet placeholders |

## Pylance Integration
The provider checks if Pylance can provide completions first. If Pylance returns a hover, the extension yields to Pylance. This prevents conflict with existing Python IntelliSense.

See also: [pylance.md](./pylance.md) for LSP communication details.