from pathlib import Path
import json

root = Path(__file__).parent.parent

quasar_path = root.parent / "quasar"
components_path = quasar_path / "ui" / "src" / "components"
asset_dir = root / "assets"

components = {}
for file in components_path.rglob("*.json"):
    with open(file) as f:
        component = json.load(f)
        components[file.name.removesuffix(".json")] = component

with open(asset_dir / "quasar_components.json", "w") as f:
    json.dump(components, f, indent=4)
