import pandas as pd
import json
from pathlib import Path


def main():
    file_path_excel = Path(__file__).with_name("Werbestandorte.xlsx")
    file_path_json = Path(__file__).with_name("standort_daten.json")

    generateJson(file_path_excel, file_path_json)

    print("Json data has been written into standort_daten.json")


def generate_image_html(image_filename):
    """Generate HTML for a single image"""
    if not image_filename:
        return ""

    base_url = "https://www.wtm-aussenwerbung.de/wp-content/uploads/"
    return (
        f"<img src='{base_url}{image_filename}' style='width: 15vw; min-width: 200px;'>"
    )


def generate_info_section(row):
    """Generate the information section of the popup"""
    visible_columns = [
        "Werbeträger",
        "Ort",
        "Standort",
        "Maße",
        "Beleuchtung",
        "Buchungsintervall",
        "Vorlaufzeit",
    ]

    info_section = f"""
    <h3>{row["Name"]}</h3>
    <br>"""

    for column in visible_columns:
        data = row.get(column)
        if data:
            info_section += f"""{column}: {data}<br>"""
        else:
            print(f"No data or column found for the key {column}.")

    info_section += """
    <br>
    <img src='https://www.wtm-aussenwerbung.de/wp-content/uploads/wtm-aussenwerbung.webp' style='width: 10vw;'>
    """
    return info_section


def generate_images_section(row):
    """Generate the images section of the popup"""
    images_html = ""

    # Add custom images if they exist
    if row["Bild1"]:
        images_html += generate_image_html(row["Bild1"])
    if row["Bild2"]:
        images_html += generate_image_html(row["Bild2"])

    return images_html


def generatePopup(row):
    """Generate complete popup HTML for a location"""
    info_section = generate_info_section(row)
    images_section = generate_images_section(row)

    popup_html = f"""
    <div class='location-popup'>
        <div class='popup-layout'>
            <div class='popup-info-section'>
                {info_section}
            </div>
            <div class='popup-images-section'>
                {images_section}
            </div>
        </div>
    </div>
    """

    # Remove extra whitespace and newlines for cleaner output
    return " ".join(popup_html.split())


def generateJson(file_path_excel, file_path_json):
    data = {"Großfläche": {"type": "FeatureCollection", "features": []}}

    excel = pd.read_excel(file_path_excel)
    excel.fillna("", inplace=True)

    for index, row in excel.iterrows():
        feature = {
            "type": "Feature",
            "properties": {"Name": "", "popupContent": "", "Category": ""},
            "geometry": {"type": "Point", "coordinates": ""},
        }

        category = row["Werbeträger"]
        if category not in data:
            data[category] = {"type": "FeatureCollection", "features": []}

        feature["properties"]["Name"] = row["Name"]
        feature["properties"]["popupContent"] = generatePopup(row)
        feature["properties"]["Category"] = category
        feature["geometry"]["coordinates"] = [
            float(x) for x in row["Koordinaten"].split(",")
        ]

        data[category]["features"].append(feature)

    try:
        with open(file_path_json, "w") as json_file:
            json.dump(data, json_file, indent=4)
    except FileNotFoundError:
        print(f"File {file_path_json} not found")
    except PermissionError:
        print(f"Permission denied for file {file_path_json}")
    except Exception as e:
        print(f"Error writing JSON file: {e}")


main()
