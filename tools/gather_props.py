from pathlib import Path
import json

root = Path(__file__).parent.parent

quasar_path = root.parent / "quasar"
src_path = quasar_path / "ui" / "src"
asset_dir = root / "assets"


def write_json(filename: str, obj):
    if not filename.endswith(".json"):
        filename += ".json"
    with open(asset_dir / filename, "w") as f:
        json.dump(obj, f, indent=4)


components: dict[str, dict[str, dict]] = {}
for file in src_path.rglob("*.json"):
    with open(file) as f:
        component = json.load(f)
        components[file.relative_to(src_path).as_posix().removesuffix((".json"))] = (
            component
        )

# hydrate properties that "extends"

extends: dict[str, dict[str, dict]] = components["api.extends"]

for component in components.values():

    def do_ext(kind):
        for name, body in component.get(kind, {}).items():
            ext = body.get("extends", None)
            source = extends[kind].get(ext, {})
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
        mixin = components[mixin_name]

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

write_json("quasar_props", sorted(list(props)))
write_json("quasar_events", sorted(list(events)))
write_json("quasar_methods", sorted(list(methods)))
write_json("quasar_slots", sorted(list(slots)))
