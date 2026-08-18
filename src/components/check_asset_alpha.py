from pathlib import Path
from PIL import Image

root = Path('/home/ubuntu/saku_project/public/assets/level-icons')
for path in sorted(root.glob('*.png')):
    image = Image.open(path).convert('RGBA')
    alpha = image.getchannel('A')
    extrema = alpha.getextrema()
    corner = image.getpixel((0, 0))
    print(f'{path.name}: mode=RGBA alpha={extrema} corner={corner}')

badges = Path('/home/ubuntu/saku_project/public/assets/level-badges')
for path in sorted(badges.glob('*.png')):
    image = Image.open(path).convert('RGBA')
    print(f'{path.name}: alpha={image.getchannel("A").getextrema()} corner={image.getpixel((0, 0))}')
