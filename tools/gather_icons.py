# get where the nicegui library is installed

import json
import nicegui
from pathlib import Path

installed_path = Path(nicegui.__file__).parent

print(f"Installed path: {installed_path}")

# open static/fonts.css

fonts_css_path = installed_path / 'static' / 'fonts.css'
print(f"Fonts CSS path: {fonts_css_path}")

dict_of_fonts = {}

with open(fonts_css_path, 'r') as f:
    font_css_lines = f.readlines()

    reversed_lines = reversed(font_css_lines)

    processing_url = ""
    font_family = ""

    for line in reversed_lines:
        # if it begins with "src: url", find the next line which begins with "font-family" and extract the font family name
        line_stripped = line.strip()
        if line_stripped.startswith("src: url"):
            # src: url(fonts/d4e71f49ac06b20e.woff2) format("woff2");
            try:
                processing_url = line_stripped.split("url")[1].split("format")[0].strip().replace("(", "").replace(")", "")
            except:
                processing_url = "???"

        elif line_stripped.startswith("font-family"):
            font_family = line_stripped.split("font-family")[1].strip().split('"')[1]
            if font_family.startswith("Material") and processing_url:
                #print(f"Font family: {font_family}")
                #print(f"Font URL: {processing_url}")
                dict_of_fonts[font_family] = processing_url

        elif "{" in line_stripped:
            processing_url = ""

from fontTools.ttLib import TTFont

ligature_list = []

def extract_ligatures_from_woff2(woff2_file, prefix="", font_family=""):
    internal_ligature_list = []
    # Load the WOFF2 font
    font = TTFont(woff2_file)

    # font.saveXML('font.xml')
    font.saveXML(Path.cwd() / f"{font_family}.xml")

    # first, get the components in the font (cmap table)
    font_cmap = font.getBestCmap()
    # print the cmap table
    # print(font_cmap)

    reverse_lookup_font_cmap = {v: chr(k) for k, v in font_cmap.items()}

    # save the table to a JSON file
    cmap_json_path = Path.cwd() / f"{font_family}_cmap.json"
    with open(cmap_json_path, 'w') as f:
        json.dump(font_cmap, f, indent=4)

    # Extract the ligature information from the font XML, reading the GSUB

    font_GSUB = font['GSUB']

    # LookupList
    lookup_list = font_GSUB.table.LookupList
    # Lookup
    print(len(lookup_list.Lookup))
    # lookup = lookup_list.Lookup[0]
    for lookup in lookup_list.Lookup:
        # LigatureSubst
        print(len(lookup.SubTable)) 
        for ligature_subst in lookup.SubTable:
            # ligature_subst = lookup.SubTable[0]

            # print the keys of this object
            print(dir(ligature_subst))
            print(str(ligature_subst.__dict__)[:1000])

            # if "ligatures" is a valid key, then it is a ligature substitution table
            if "ligatures" in ligature_subst.__dict__:
                ligatures_processed = ligature_subst.ligatures
            else:
                ligatures_processed = ligature_subst.ExtSubTable.ligatures

            try:
                for key,value in ligatures_processed.items():
                    # print(f"Key: {key}, Value: {value}")
                    for subvalue in value:
                        # print(f"Subvalue: {subvalue}")
                        # print(f"Subvalue: {subvalue.__dict__}")

                        ligature_string = prefix+reverse_lookup_font_cmap[key]+"".join([reverse_lookup_font_cmap[component] for component in subvalue.Component])
                        ligature_list.append(ligature_string)
                        internal_ligature_list.append(ligature_string)

                        #ligature_list.append(key + "".join(subvalue.Component))
                        #internal_ligature_list.append(key + "".join(subvalue.Component))
                
            except Exception as e:
                print(f"Error processing ligatures: {e}")

    return internal_ligature_list

# for each key in dict_of_fonts, get the font file and print the font family and the font file
for font_family, font_file in dict_of_fonts.items():
    # get the font file from the fonts folder in the nicegui installation path
    font_path = installed_path / 'static' / font_file
    print(f"Font family: {font_family}")
    print(f"Font file: {font_path}")

    is_symbols = "Symbols" in font_family
    is_rounded = "Round" in font_family
    is_outlined = "Outlined" in font_family
    is_sharp = "Sharp" in font_family

    prefix = ""
    if is_symbols:
        prefix += "sym_"

    if is_rounded:
        prefix += "r_"
    if is_outlined:
        prefix += "o_"
    if is_sharp:
        prefix += "s_"
    
    print(f"Prefix: {prefix}")

    # extract the ligatures from the font file
    ligatures = extract_ligatures_from_woff2(font_path, prefix, font_family)
    # print the ligatures
    print(f"Ligatures: {len(ligatures)}")

ligature_list = sorted(list(set(ligature_list)))

# save ligature_list to a ligature_lists.json
ligature_list_path = Path.cwd() / "ligature_lists.json"
with open(ligature_list_path, 'w') as f:
    json.dump(ligature_list, f, indent=4)