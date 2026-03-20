# Practices

## Architecture Patterns
- Provider classes register themselves with VS Code in their constructors
- Pylance adapter provides type inference for determining NiceGUI element classes
- Context capture determines what completions/hovers to provide based on cursor position

## Code Style
- Biome for linting (`biome.json`)
- TypeScript with strict settings
- Async/await for LSP communication

## Completion Flow
1. Pylance returns null for string literals → extension handles them
2. `capture_document_context()` determines context kind from surrounding text
3. If class known → use `quasarData[className]` for targeted completions
4. If class unknown → fall back to `quasarLists` generic lists

## Extending Providers
- Add new context kinds in `doc_utils.ts`
- Add new data sources in `data.ts` with proper exports
- Register new providers in `extension.ts` constructor