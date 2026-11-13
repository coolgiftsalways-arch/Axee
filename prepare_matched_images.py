
import os
import csv
import zipfile
from collections import defaultdict

SOURCE_ZIP = r"S:\Axee\Clothing (2).zip"
CSV_PATH = r"S:\Axee\Clothing_Scan_Report\exact_matches.csv"
OUTPUT_DIR = r"S:\Axee\MATCHED_IMAGES"
OUTPUT_ZIP = os.path.join(OUTPUT_DIR, "UNBOUND_MATCHED_IMAGES.zip")

os.makedirs(OUTPUT_DIR, exist_ok=True)

with open(CSV_PATH, "r", encoding="utf-8-sig", newline="") as f:
    matches = list(csv.DictReader(f))

# Map folder names to their matched MongoDB products
matched = {}
for row in matches:
    matched[row["folder_name"]] = row

used_names = set()
mapping_rows = []
seen_files = set()
extracted_count = 0
missing_folders = set(matched)

with zipfile.ZipFile(SOURCE_ZIP, "r") as source:
    with zipfile.ZipFile(OUTPUT_ZIP, "w", zipfile.ZIP_DEFLATED) as output:

        for info in source.infolist():
            if info.is_dir():
                continue

            path = info.filename.replace("\\", "/")
            parts = path.split("/")

            if len(parts) < 2:
                continue

            folder = parts[-2]
            original_name = parts[-1]

            if folder not in matched:
                continue

            if not original_name.lower().endswith(
                (".jpg", ".jpeg", ".png", ".webp", ".avif")
            ):
                continue

            # Ignore duplicate archive entries
            unique_key = (folder, original_name.lower())
            if unique_key in seen_files:
                continue
            seen_files.add(unique_key)

            product = matched[folder]
            product_id = product["product_id"]

            # Give every image a globally unique filename
            ext = os.path.splitext(original_name)[1].lower()
            sequence = 1

            while True:
                new_name = f"{product_id}_{sequence:02d}{ext}"
                if new_name.lower() not in used_names:
                    break
                sequence += 1

            used_names.add(new_name.lower())

            archive_name = f"product-images/{new_name}"
            output.writestr(archive_name, source.read(info))

            mapping_rows.append({
                "product_name": product["product_name"],
                "product_id": product_id,
                "category": product["category"],
                "original_filename": original_name,
                "new_filename": new_name,
                "hostinger_path": f"/product-images/{new_name}"
            })

            extracted_count += 1
            missing_folders.discard(folder)

# Save mapping CSV
mapping_csv = os.path.join(OUTPUT_DIR, "image_mapping.csv")

with open(mapping_csv, "w", newline="", encoding="utf-8-sig") as f:
    fields = [
        "product_name", "product_id", "category",
        "original_filename", "new_filename", "hostinger_path"
    ]
    writer = csv.DictWriter(f, fieldnames=fields)
    writer.writeheader()
    writer.writerows(mapping_rows)

# Save folders that had no extractable images
unmatched_csv = os.path.join(OUTPUT_DIR, "unmatched_folders.csv")

with open(unmatched_csv, "w", newline="", encoding="utf-8-sig") as f:
    writer = csv.DictWriter(
        f, fieldnames=["folder_name", "product_name", "product_id"]
    )
    writer.writeheader()

    for folder in sorted(missing_folders):
        row = matched[folder]
        writer.writerow({
            "folder_name": folder,
            "product_name": row["product_name"],
            "product_id": row["product_id"]
        })

print("\n========== IMAGE EXPORT COMPLETE ==========")
print("Matched product folders:", len(matches))
print("Folders with no extractable images:", len(missing_folders))
print("Unique images exported:", extracted_count)
print("\nOUTPUT FILES:")
print(OUTPUT_ZIP)
print(mapping_csv)
print(unmatched_csv)
print("\nOriginal ZIP and MongoDB export were not modified.")
