# Data Sources

**Directory:** `assets/`

JSON files loaded at runtime to provide completion and hover data.

## Files

### `quasar_components.json`
Full Quasar component metadata indexed by component name.

```typescript
interface QuasarComponentList {
  [componentName: string]: {
    props?: { [name: string]: QuasarAttribute };
    events?: { [name: string]: QuasarAttribute };
    methods?: { [name: string]: QuasarAttribute };
    slots?: { [name: string]: QuasarAttribute };
    internal?: boolean;
    mixins?: string[];
  };
}
```

Used when Pylance successfully identifies the element class.

### `quasar_lists.json`
Generic lists of attribute names (no descriptions).

```typescript
interface QuasarGenericLists {
  props: string[];
  events: string[];
  methods: string[];
  slots: string[];
}
```

Used as fallback when class name is unknown.

### `tailwind_classes.json`
Array of Tailwind CSS class names for completions in `.classes()` method calls.

### `material_icons.json`
Array of Material Design icon names for icon completions.

## QuasarAttribute Interface

```typescript
interface QuasarAttribute {
  type?: string;          // e.g., "Boolean", "String"
  desc?: string;          // Description text
  values?: string[];      // Allowed values (quoted)
  examples?: string[];    // Example usage
  default?: string;       // Default value
  internal?: boolean;     // If true, exclude from completions
  params?: JSONObject;    // Method parameters
  returns?: JSONObject;   // Method return types
}
```

## Loading Mechanism

```typescript
// In src/providers/data.ts
function load(file: string) {
  const uri = get_extension_uri('assets', file);
  return JSON.parse(fs.readFileSync(uri.fsPath).toString());
}
```

Files are loaded synchronously at extension activation.

## Data Generation

The `tools/` directory contains Python scripts for generating these JSON files from Quasar API documentation:
- `gather_props.py` - Extracts Quasar component metadata
- `gather_icons.py` - Extracts Material icon names