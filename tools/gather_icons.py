from pathlib import Path
import json
import re

root = Path(__file__).parent.parent
quasar_path = root.parent / "quasar"
asset_dir = root / "assets"


all_icons = []
capital_letter = re.compile(r"(?<!^)(?=[A-Z])")
number = re.compile(r"([a-z])([0-9])")


for file in quasar_path.rglob("material*/icons.json"):
    with open(file, encoding="utf-8") as f:
        names: list[str] = json.load(f)

        for name in names:
            name = capital_letter.sub("_", name).lower()
            name = number.sub(r"\1_\2", name)
                
            name = name.removeprefix("mat_")
            name = re.sub("^round_", "r_", name)
            name = re.sub("^sharp_", "s_", name)
            name = re.sub("^outlined_", "o_", name)
            name = re.sub("^sym_outlined_", "sym_o_", name)
            name = re.sub("^sym_rounded_", "sym_r_", name)
            name = re.sub("^sym_sharp_", "sym_s_", name)
            name = name.replace("3x_3", "3x3")
            name = name.replace("4x_4", "4x4")
            name = name.replace("co_2", "co2")
            name = name.replace("crop_169", "crop_16_9")
            name = name.replace("crop_32", "crop_3_2")
            name = name.replace("crop_54", "crop_5_4")
            name = name.replace("crop_75", "crop_7_5")
            
            all_icons.append(name)

all_icons = sorted(list(set(all_icons)))

with open(asset_dir / "material_icons.json", "w") as f:
    json.dump(all_icons, f, indent=4, sort_keys=True)
