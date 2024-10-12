from pathlib import Path
import json

root = Path(__file__).parent.parent

quasar_path = root.parent / "quasar"
components_path = quasar_path / "ui" / "src" / "components"
asset_dir = root / "assets"

components: dict[str, dict[str, any]] = {}
for file in components_path.rglob("*.json"):
    with open(file) as f:
        component = json.load(f)
        components[file.name.removesuffix(".json")] = component

with open(asset_dir / "quasar_components.json", "w") as f:
    json.dump(components, f, indent=4)


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

with open(asset_dir / "quasar_props.json", "w") as f:
    json.dump(list(props), f, indent=4)
with open(asset_dir / "quasar_events.json", "w") as f:
    json.dump(list(events), f, indent=4)
with open(asset_dir / "quasar_methods.json", "w") as f:
    json.dump(list(methods), f, indent=4)
with open(asset_dir / "quasar_slots.json", "w") as f:
    json.dump(list(slots), f, indent=4)
