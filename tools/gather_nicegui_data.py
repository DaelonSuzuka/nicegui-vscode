from __future__ import annotations

import inspect
import json
import re
from pathlib import Path

from nicegui import ui
from nicegui.element import Element

ROOT = Path(__file__).resolve().parent.parent
ASSET_DIR = ROOT / "assets"


def write_json(filename: str, obj) -> None:
    path = ASSET_DIR / filename
    with open(path, "w", encoding="utf-8") as f:
        json.dump(obj, f, indent=4, sort_keys=True)
        f.write("\n")


def load_quasar_keys() -> set[str]:
    with open(ASSET_DIR / "quasar_components.json", encoding="utf-8") as f:
        return set(json.load(f).keys())


def infer_quasar_key(cls: type[Element], quasar_keys: set[str]) -> str | None:
    init_doc = inspect.getdoc(cls.__init__) or ""

    for token in re.findall(r"\bQ[A-Z][A-Za-z0-9]+\b", init_doc):
        key = token.lower()
        if key in quasar_keys:
            return key

    scroll_area_match = re.search(r"Quasar\s+`([A-Z][A-Za-z0-9]+)", init_doc)
    if scroll_area_match:
        key = f"q{scroll_area_match.group(1).lower()}"
        if key in quasar_keys:
            return key

    try:
        init_source = inspect.getsource(cls.__init__)
    except (OSError, TypeError):
        init_source = ""

    tag_match = re.search(r"""tag\s*=\s*['"](q-[a-z0-9-]+)['"]""", init_source)
    if tag_match:
        key = "q" + tag_match.group(1)[2:].replace("-", "")
        if key in quasar_keys:
            return key

    fallback = f"q{cls.__name__.lower()}"
    fallback = fallback.replace("button", "btn")
    fallback = fallback.replace("image", "img")
    if fallback in quasar_keys:
        return fallback

    return None


def main() -> None:
    quasar_keys = load_quasar_keys()

    exported_names = sorted({name for name in ui.__all__ if not name.startswith("_")})
    mapping: dict[str, str] = {}

    for name in exported_names:
        obj = getattr(ui, name, None)
        if inspect.isclass(obj) and issubclass(obj, Element):
            key = infer_quasar_key(obj, quasar_keys)
            if key:
                mapping[obj.__name__] = key

    write_json("nicegui_functions.json", exported_names)
    write_json("nicegui_to_quasar_map.json", mapping)

    print(f"exported ui names: {len(exported_names)}")
    print(f"class-to-quasar mappings: {len(mapping)}")


if __name__ == "__main__":
    main()
