# Hover Provider

**File:** `src/providers/hover.ts`

## Purpose
Provides documentation hovers for Quasar attributes (props, events, methods, slots) in NiceGUI Python files.

## How It Works

1. Capture document context at cursor position
2. If context is `classes` or `style`, return undefined (not implemented)
3. Query Pylance for class name of the element
4. Look up attribute in `quasarData[className][ctx.kind][word]`
5. Build Markdown hover content with:
   - Type information
   - Description
   - Examples (if available)
   - Allowed values (if available)
   - Quasar documentation URL

## Hover Format

```
<name>: <type>

---

<description>

---

Examples:
 - example1
 - example2

---

Values:
 - value1
 - value2

[https://quasar.dev/vue-components/<component>]
```

## URL Generation
Component names are transformed for Quasar docs URLs:
- Strip leading `q` (e.g., `q-btn` → `btn`)
- Replace `btn` → `button`
- Replace `img` → `image`

## Limitations
- No hover support for Tailwind classes in `.classes()` 
- No hover support for `style` attributes
- Depends on Pylance successfully identifying element class