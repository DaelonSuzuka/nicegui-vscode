from pathlib import Path
import json

root = Path(__file__).parent.parent

quasar_path = root.parent / "quasar"
components_path = quasar_path / "ui" / "src" / "components"
asset_dir = root / "assets"


def write_json(filename: str, obj):
    if not filename.endswith(".json"):
        filename += ".json"
    with open(asset_dir / filename, "w") as f:
        json.dump(obj, f, indent=4)


components: dict[str, dict[str, any]] = {}
for file in components_path.rglob("*.json"):
    with open(file) as f:
        component = json.load(f)
        components[file.name.removesuffix(".json")] = component

write_json("quasar_components", components)


props = set()
events = set()
methods = set()
slots = set()

for component in components.values():
    if items := component.get("props", None):
        for item in items:
            props.add(item)
    if items := component.get("events", None):
        for item in items:
            events.add(item)
    if items := component.get("methods", None):
        for item in items:
            methods.add(item)
    if items := component.get("slots", None):
        for item in items:
            slots.add(item)

write_json("quasar_props", sorted(list(props)))
write_json("quasar_events", sorted(list(events)))
write_json("quasar_methods", sorted(list(methods)))
write_json("quasar_slots", sorted(list(slots)))
write_json("quasar_classes", sorted(list(components.keys())))
