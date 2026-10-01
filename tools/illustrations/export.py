"""Génère toutes les illustrations des histoires du seed et les exporte en JPEG dans api/seed-assets.

    pip install pillow
    python3 export.py

Les PNG en pleine taille restent dans build/ (ignoré par git) pour les retouches.
"""
import glob
import os
import subprocess
import sys

from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
BUILD = os.path.join(HERE, 'build')
DEST = os.path.join(HERE, '..', '..', 'api', 'seed-assets')
STORIES = ['pirates', 'lepic', 'lisbonne', 'borealis', 'cuisine']
ENEMIES = {'malgrin', 'kraken', 'corbeau'}


def run(script, out):
    os.makedirs(out, exist_ok=True)
    subprocess.run([sys.executable, script, out], cwd=HERE, check=True)


def save(src, dst, size, quality):
    Image.open(src).convert('RGB').resize(size, Image.LANCZOS).save(dst, 'JPEG', quality=quality, optimize=True, progressive=True)


if __name__ == '__main__':
    for story in STORIES:
        run(f'{story}.py', f'{BUILD}/covers')
        run(f'bg_{story}.py', f'{BUILD}/decors')
    run('objets.py', f'{BUILD}/objets')

    for f in glob.glob(f'{BUILD}/covers/*.png'):
        save(f, os.path.join(DEST, os.path.basename(f)[:-4] + '.jpg'), (768, 768), 85)
    for f in glob.glob(f'{BUILD}/decors/*.png'):
        story, lieu = os.path.basename(f)[:-4].split('-', 1)
        save(f, os.path.join(DEST, f'{story}-decor-{lieu}.jpg'), (960, 512), 82)
    for f in glob.glob(f'{BUILD}/objets/*.png'):
        story, key = os.path.basename(f)[:-4].split('-', 1)
        kind = 'ennemi' if key in ENEMIES else 'objet'
        save(f, os.path.join(DEST, f'{story}-{kind}-{key}.jpg'), (384, 384), 85)
    print('Illustrations exportées dans api/seed-assets')
