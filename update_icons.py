import os
from PIL import Image

icon_path = "/home/ubuntu/upload/3969183_ico.png"
if not os.path.exists(icon_path):
    print("Icon not found!")
    exit(1)

img = Image.open(icon_path).convert("RGBA")

densities = {
    "mipmap-mdpi": 48,
    "mipmap-hdpi": 72,
    "mipmap-xhdpi": 96,
    "mipmap-xxhdpi": 144,
    "mipmap-xxxhdpi": 192
}

res_dir = "/home/ubuntu/saku_project/android/app/src/main/res"

for folder, size in densities.items():
    target_dir = os.path.join(res_dir, folder)
    if os.path.exists(target_dir):
        resized = img.resize((size, size), Image.Resampling.LANCZOS)
        resized.save(os.path.join(target_dir, "ic_launcher.png"))
        resized.save(os.path.join(target_dir, "ic_launcher_round.png"))
        resized.save(os.path.join(target_dir, "ic_launcher_foreground.png"))
        print(f"Updated {folder} with size {size}x{size}")

print("App icons updated successfully!")
