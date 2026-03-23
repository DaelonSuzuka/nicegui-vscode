from pathlib import Path
import json
import os

root = Path(__file__).parent.parent

asset_dir = root / "assets"


def resolve_source_path() -> Path:
    env = os.environ.get("QUASAR_API_DIR")
    if env:
        path = Path(env)
        if path.exists():
            return path

    candidates = [
        root.parent / "quasar" / "ui" / "src",         # legacy local quasar repo
        root / "node_modules" / "quasar" / "dist" / "api",  # npm package API files
    ]
    for path in candidates:
        if path.exists():
            return path

    raise FileNotFoundError(
        "Could not find Quasar API source. "
        "Set QUASAR_API_DIR or install quasar npm package."
    )


src_path = resolve_source_path()


def write_json(filename: str, obj, sort_keys=False):
    if not filename.endswith(".json"):
        filename += ".json"
    with open(asset_dir / filename, "w") as f:
        json.dump(obj, f, indent=4, sort_keys=sort_keys)


components: dict[str, dict[str, dict]] = {}
for file in src_path.rglob("*.json"):
    with open(file, encoding='utf-8') as f:
        if src_path.name == "api":
            # npm package format: dist/api/QBtn.json
            name = file.stem
        else:
            # quasar source format: ui/src/components/QBtn.json
            name = file.relative_to(src_path).as_posix().removesuffix((".json"))
        components[name] = json.load(f)

# hydrate properties that "extends"
extends: dict[str, dict[str, dict]] = components.get("api.extends", {})

if extends:
    for component in components.values():

        def do_ext(kind):
            for name, body in component.get(kind, {}).items():
                ext = body.get("extends", None)
                source = extends.get(kind, {}).get(ext, {})
                for key, value in source.items():
                    if key not in component[kind][name]:
                        component[kind][name][key] = value

        do_ext("props")
        do_ext("events")
        do_ext("methods")
        do_ext("slots")


# hydrate mixins
for component in components.values():
    for mixin_name in component.get("mixins", []):
        mixin = components.get(mixin_name)
        if not mixin:
            continue

        def apply(kind):
            if kind not in component:
                component[kind] = {}

            for key, value in mixin.get(kind, {}).items():
                if key not in component[kind]:
                    component[kind][key] = value

        apply("props")
        apply("events")
        apply("methods")
        apply("slots")

# fix component names
out = {}
for name, component in components.items():
    out[name.split("/")[-1].lower()] = component


write_json("quasar_components", out)


props = set()
events = set()
methods = set()
slots = set()

for component in components.values():
    for item in component.get("props", []):
        props.add(item)
    for item in component.get("events", []):
        events.add(item)
    for item in component.get("methods", []):
        methods.add(item)
    for item in component.get("slots", []):
        slots.add(item)

lists = {
    "props": list(props),
    "events": list(events),
    "methods": list(methods),
    "slots": list(slots),
}

write_json("quasar_lists", lists, sort_keys=True)
