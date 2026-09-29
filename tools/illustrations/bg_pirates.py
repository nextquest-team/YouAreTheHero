import math
import sys

from kit import INK, Canvas, hexc
from pirates import ship, tentacle, wave_band

OUT = sys.argv[1] if len(sys.argv) > 1 else 'out'
W, H = 1200, 640


def barrel(c, x, base, w=90, h=120, color='#8A5A32'):
    bulge = w * 0.08
    body = [(x - w / 2, base), (x - w / 2 - bulge, base - h / 2), (x - w / 2, base - h), (x + w / 2, base - h), (x + w / 2 + bulge, base - h / 2), (x + w / 2, base)]
    c.wash(body, hexc(color, 255), wobble=0.6, blur=0.3)
    c.hatch([(x + w * 0.1, base), (x + w * 0.1, base - h), (x + w / 2, base - h), (x + w / 2 + bulge, base - h / 2), (x + w / 2, base)], spacing=5, angle=85, alpha=90)
    for k in range(1, 5):
        sx = x - w / 2 + w * k / 5
        c.ink([(sx, base - 2), (sx + (sx - x) * 0.08, base - h / 2), (sx, base - h + 2)], width=1.0, color=INK + (130,))
    for hy in (0.15, 0.85):
        yy = base - h * hy
        c.ink([(x - w / 2 - bulge * 0.5, yy), (x + w / 2 + bulge * 0.5, yy)], width=4, color=hexc('#3A3430', 255))
    c.ink(body, width=2, closed=True)
    top = c.ellipse_pts(x, base - h, w / 2, w * 0.12, 30)
    c.wash(top, hexc('#A9774A', 255), wobble=0.3, blur=0.2)
    c.ink(top, width=1.6, closed=True)


def lantern(c, x, y, glow=True):
    c.ink([(x, 0), (x, y - 40)], width=1.6)
    if glow:
        c.glow(x, y, 180, hexc('#FFB85C', 150))
    body = [(x - 16, y - 34), (x + 16, y - 34), (x + 20, y + 20), (x - 20, y + 20)]
    c.wash(body, hexc('#FFD98A', 255), wobble=0.3, blur=0.2, edge=False)
    c.ink(body, width=2, closed=True)
    c.ink([(x, y - 34), (x, y + 20)], width=1.2)
    c.ink([(x - 22, y + 20), (x + 22, y + 20)], width=3)
    c.ink([(x - 12, y - 34), (x, y - 46), (x + 12, y - 34)], width=2)


def palm(c, x, base, h, lean=0.25, color='#2F5A48'):
    pts = [(x + lean * h * (t ** 1.5), base - h * t) for t in [i / 12 for i in range(13)]]
    for i in range(len(pts) - 1):
        c.ink([pts[i], pts[i + 1]], width=12 - i * 0.5, color=hexc('#6B4F32', 255), jitter=0.2)
        c.ink([(pts[i][0] - 6, pts[i][1]), (pts[i][0] + 6, pts[i][1] - 3)], width=1.2, color=INK + (150,))
    tx, ty = pts[-1]
    for k in range(7):
        a = math.pi + k * math.pi / 6 + 0.1
        leaf = []
        for t in [i / 10 for i in range(11)]:
            lx = tx + math.cos(a) * 130 * t
            ly = ty + math.sin(a) * 60 * t + 70 * t * t
            leaf.append((lx, ly))
        up = [(lx, ly - 10 * math.sin(math.pi * i / 10)) for i, (lx, ly) in enumerate(leaf)]
        down = [(lx, ly + 10 * math.sin(math.pi * i / 10)) for i, (lx, ly) in enumerate(leaf)]
        shape = up + down[::-1]
        c.wash(shape, hexc(color, 255), wobble=0.6, blur=0.2)
        c.ink(leaf, width=1.2, color=INK + (170,))
        for i in range(1, 10):
            lx, ly = leaf[i]
            c.ink([(lx, ly), (lx + 6, ly + 12)], width=1, color=INK + (120,))


def chest(c, x, base, w=220, h=110, open_=True, gold=False):
    front = [(x - w / 2, base), (x - w / 2, base - h), (x + w / 2, base - h), (x + w / 2, base)]
    c.wash(front, hexc('#7A4A26', 255), wobble=0.4, blur=0.2)
    c.hatch(front, spacing=6, angle=0, alpha=70)
    c.ink(front, width=2.2, closed=True)
    for bx in (x - w * 0.35, x + w * 0.35):
        c.wash([(bx - 8, base), (bx - 8, base - h), (bx + 8, base - h), (bx + 8, base)], hexc('#3A3430', 255), wobble=0.2, blur=0.1)
    c.wash([(x - 14, base - h + 10), (x + 14, base - h + 10), (x + 14, base - h + 40), (x - 14, base - h + 40)], hexc('#C9A040', 255), wobble=0.2, blur=0.1)
    if open_:
        lid = [(x - w / 2, base - h), (x - w / 2 + 12, base - h - 90), (x + w / 2 - 12, base - h - 90), (x + w / 2, base - h)]
        c.wash(lid, hexc('#5E3A1E', 255), wobble=0.4, blur=0.2)
        c.hatch(lid, spacing=5, angle=0, alpha=90)
        c.ink(lid, width=2, closed=True)
        if gold:
            c.glow(x, base - h, 120, hexc('#FFD76A', 150))
            heap = c.ellipse_pts(x, base - h + 4, w / 2 - 6, 26, 40, math.pi, 2 * math.pi)
            c.wash(heap, hexc('#E8B94A', 255), wobble=0.6, blur=0.2)
            c.dots(30, (x - w / 2 + 20, base - h - 20, x + w / 2 - 20, base - h), hexc('#FFF1B0', 230), 2, 4)
    else:
        lid = c.ellipse_pts(x, base - h, w / 2, 40, 30, math.pi, 2 * math.pi)
        c.wash(lid, hexc('#5E3A1E', 255), wobble=0.4, blur=0.2)
        c.ink(lid, width=2)


def cale():
    c = Canvas(W, H, seed=40)
    c.vgrad(hexc('#3A2A1E'), hexc('#1E1510'), 0, H)
    # Membrures de la coque.
    for k in range(-2, 9):
        x = 150 * k + 60
        rib = [(x + 60 * math.sin(t * math.pi / 2) * (1 if x > 600 else -1) * 0.3, 640 - 700 * t) for t in [i / 10 for i in range(11)]]
        c.ink(rib, width=22, color=hexc('#4A3322', 255), jitter=0.3)
        c.ink(rib, width=1.4, color=INK + (200,))
    for y in range(40, 640, 46):
        c.ink([(0, y), (1200, y + 10)], width=1.2, color=INK + (120,))
    # Rais de lumière entre les planches du pont.
    for x in (330, 520, 760, 930):
        beam = [(x, 0), (x + 16, 0), (x + 90, 640), (x + 30, 640)]
        c.wash(beam, hexc('#FFE3A6', 50), wobble=0, blur=6, edge=False)
    lantern(c, 600, 170)
    c.vgrad(hexc('#4A3322'), hexc('#2A1E14'), 500, 640)
    for x in range(0, 1200, 70):
        c.ink([(x, 500), (x - 30, 640)], width=1.0, color=INK + (110,))
    for x, base, w, h in [(140, 560, 120, 160), (260, 580, 110, 150), (200, 420, 110, 140), (980, 570, 130, 170), (1100, 590, 110, 150), (1040, 420, 110, 150), (420, 610, 100, 130)]:
        barrel(c, x, base, w, h)
    # Caisses.
    for x, y, s in [(760, 600, 130), (860, 600, 100), (800, 480, 100)]:
        box = [(x - s / 2, y), (x - s / 2, y - s), (x + s / 2, y - s), (x + s / 2, y)]
        c.wash(box, hexc('#9A6B3E', 255), wobble=0.4, blur=0.2)
        c.ink(box, width=2, closed=True)
        c.ink([(x - s / 2, y), (x + s / 2, y - s)], width=3, color=hexc('#5E3A1E', 255))
        c.ink([(x - s / 2, y - s / 2), (x + s / 2, y - s / 2)], width=1.2)
    c.finish(f'{OUT}/pirates-cale.png', vignette=0.35)


def pont():
    c = Canvas(W, H, seed=41)
    c.vgrad(hexc('#8FA5B0'), hexc('#D8C9A8'), 0, 330)
    # La Sterne en feu au loin, fumée.
    c.vgrad(hexc('#5C7F8E'), hexc('#3F6272'), 330, 420)
    c.glow(900, 300, 120, hexc('#FF8A3C', 180))
    for k in range(9):
        c.cloud(900 - k * 60 + k * k * 4, 260 - k * 26, 160 + k * 30, 40 + k * 4, hexc('#4A4440', 150 - k * 10), soft=6)
    hull = [(800, 330), (1010, 330), (990, 360), (820, 360)]
    c.wash(hull, hexc('#4A3322', 255), wobble=0.4, blur=0.2)
    c.ink(hull, width=1.6, closed=True)
    c.ink([(900, 330), (900, 200)], width=3)
    c.wash([(900, 210), (960, 230), (900, 260)], hexc('#E8D8B8', 220), wobble=0.5, blur=0.2)
    for fx in (850, 920, 960):
        flame = [(fx - 14, 332), (fx, 290 - (fx % 30)), (fx + 14, 332)]
        c.wash(flame, hexc('#FF9A3C', 240), wobble=2, blur=1)
    # Pont du Corbeau Noir en perspective.
    deck = [(-20, 640), (-20, 430), (1220, 430), (1220, 640)]
    c.wash(deck, hexc('#A87A4E', 255), wobble=0.4, blur=0.2)
    for k in range(-20, 30):
        x0 = 600 + k * 30
        x1 = 600 + k * 90
        c.ink([(x0, 430), (x1, 640)], width=1.2, color=INK + (110,))
    for y in (470, 530, 600):
        c.ink([(-20, y), (1220, y)], width=0.8, color=INK + (60,))
    # Bastingage.
    c.wash([(-20, 400), (1220, 400), (1220, 432), (-20, 432)], hexc('#6B4A2E', 255), wobble=0.3, blur=0.2)
    c.ink([(-20, 400), (1220, 400)], width=3)
    for x in range(0, 1220, 40):
        c.ink([(x, 400), (x, 432)], width=2)
    # Grand mât et cordages.
    c.wash([(560, 640), (560, -10), (600, -10), (600, 640)], hexc('#6B4A2E', 255), wobble=0.3, blur=0.2)
    c.hatch([(580, 640), (580, -10), (600, -10), (600, 640)], spacing=4, angle=90, alpha=120)
    c.ink([(560, 640), (560, -10)], width=2)
    c.ink([(600, 640), (600, -10)], width=2)
    for k in range(6):
        c.ink([(580, 40 + k * 8), (80 + k * 40, 400)], width=1.2, color=INK + (200,))
        c.ink([(580, 40 + k * 8), (1100 - k * 40, 400)], width=1.2, color=INK + (200,))
    for y in range(120, 400, 40):
        t = (y - 40) / 360
        c.ink([(580 - 500 * t, y), (580 + 520 * t, y)], width=0.8, color=INK + (110,))
    barrel(c, 180, 560, 90, 110)
    # Sabre au sol.
    c.ink([(760, 600), (940, 560)], width=5, color=hexc('#C8CED3', 255))
    c.ink([(760, 600), (940, 560)], width=1.2)
    c.ink([(930, 548), (950, 574)], width=5, color=hexc('#C9A040', 255))
    c.ink([(944, 562), (976, 555)], width=7, color=hexc('#3A2A1E', 255))
    c.dots(40, (0, 0, 1200, 400), hexc('#5A5046', 120), 1, 3)
    c.finish(f'{OUT}/pirates-pont.png', vignette=0.25)


def mer():
    c = Canvas(W, H, seed=42)
    c.vgrad(hexc('#9CC3D6'), hexc('#F2E3C0'), 0, 420)
    c.glow(260, 150, 120, hexc('#FFF4D0', 200))
    c.wash(c.ellipse_pts(260, 150, 48, 48), hexc('#FFF2C8', 255), wobble=0.3, blur=0.5, edge=False)
    c.cloud(780, 110, 360, 40, hexc('#FFFFFF', 210))
    c.cloud(1080, 200, 220, 26, hexc('#FFFFFF', 180))
    c.cloud(420, 260, 220, 20, hexc('#FFFFFF', 160))
    c.vgrad(hexc('#4E8DA6'), hexc('#2A5B74'), 410, 640)
    ship(c, 640, 470, s=0.72)
    for i, (y, a, l, col) in enumerate([(460, 5, 120, '#4F90A8'), (500, 8, 160, '#3E7C96'), (560, 12, 200, '#316A84'), (620, 16, 240, '#265870')]):
        wave_band(c, y, a, l, hexc(col, 235), depth=300, phase=i * 1.3)
    for x, y in [(900, 180), (960, 220), (330, 300)]:
        c.ink([(x - 16, y), (x - 6, y - 8), (x, y), (x + 6, y - 8), (x + 16, y)], width=2)
    c.finish(f'{OUT}/pirates-mer.png', vignette=0.2)


def tempete():
    c = Canvas(W, H, seed=43)
    c.vgrad(hexc('#1C2230'), hexc('#3E4A5A'), 0, 440)
    for k in range(6):
        c.cloud(c.rng.uniform(0, 1200), c.rng.uniform(40, 260), c.rng.uniform(300, 500), c.rng.uniform(40, 70), hexc('#141A26', 200), soft=8)
    # Éclair.
    bolt = [(880, 0), (850, 110), (890, 120), (840, 250), (870, 255), (820, 380)]
    c.glow(850, 180, 200, hexc('#C8D8FF', 90))
    c.ink(bolt, width=5, color=hexc('#F4F7FF', 255), jitter=0)
    c.ink(bolt, width=1.5, color=hexc('#9FB8FF', 255), jitter=0)
    c.vgrad(hexc('#2A3C4A'), hexc('#121C26'), 400, 640)
    ship(c, 520, 470, s=0.8)
    for i, (y, a, l, col) in enumerate([(430, 26, 160, '#2F4656'), (480, 34, 200, '#263C4A'), (560, 40, 240, '#1C2E3A')]):
        wave_band(c, y, a, l, hexc(col, 240), depth=300, phase=i * 2.1)
    path = [(1050 + 30 * math.sin(t * 2), 700 - t * 520) for t in [i / 16 for i in range(17)]]
    tentacle(c, path, 60, 10, hexc('#9A3F30', 250))
    path = [(150 - 40 * math.sin(t * 2.4), 700 - t * 380) for t in [i / 14 for i in range(15)]]
    tentacle(c, path, 46, 8, hexc('#8A3528', 250))
    # Pluie.
    for _ in range(260):
        x, y = c.rng.uniform(0, 1250), c.rng.uniform(0, 640)
        c.ink([(x, y), (x - 14, y + 34)], width=1, color=hexc('#C8D4E0', 90), jitter=0)
    c.finish(f'{OUT}/pirates-tempete.png', vignette=0.35)


def plage():
    c = Canvas(W, H, seed=44)
    c.vgrad(hexc('#A8D0D8'), hexc('#F4E6C4'), 0, 330)
    c.cloud(300, 90, 300, 30, hexc('#FFFFFF', 200))
    # Falaise avec la grotte.
    cliff = [(760, 360), (820, 150), (930, 110), (1060, 140), (1220, 120), (1220, 380)]
    c.wash(cliff, hexc('#3A3A40', 255), wobble=1.5, blur=0.3)
    c.hatch(cliff, spacing=6, angle=-60, alpha=110)
    c.ink(cliff[:-1], width=2)
    cave = c.ellipse_pts(990, 300, 60, 70, 30, math.pi, 2 * math.pi)
    c.wash(cave + [(1050, 330), (930, 330)], hexc('#0E0C0A', 255), wobble=0.8, blur=0.3)
    # Jungle bleu-vert.
    jungle = [(-20, 400)] + [(x, 250 - 40 * math.sin(x / 70) ** 2 - 20 * math.sin(x / 23)) for x in range(-20, 800, 20)] + [(800, 400)]
    c.wash(jungle, hexc('#1F5A5A', 255), wobble=2, blur=0.4)
    c.hatch(jungle, spacing=5, angle=70, alpha=90)
    # Mer turquoise et bateau à l'ancre.
    c.vgrad(hexc('#4FB3B0'), hexc('#2E8A94'), 330, 420)
    ship(c, 520, 372, s=0.28)
    for k in range(5):
        c.ink([(0, 350 + k * 14), (1200, 352 + k * 14)], width=1, color=hexc('#E8F8F4', 90))
    # Sable noir.
    sand = [(-20, 640), (-20, 420)] + [(x, 410 + 14 * math.sin(x / 90)) for x in range(-20, 1240, 30)] + [(1220, 640)]
    c.wash(sand, hexc('#2E2A28', 255), wobble=1, blur=0.3)
    c.ink([(x, 410 + 14 * math.sin(x / 90)) for x in range(-20, 1240, 30)], width=4, color=hexc('#E8F8F4', 200))
    c.dots(300, (0, 430, 1200, 640), hexc('#5A5450', 200), 0.8, 2)
    palm(c, 150, 600, 380, lean=0.35)
    palm(c, 1090, 620, 330, lean=-0.3, color='#2A6450')
    barrel(c, 700, 560, 80, 100)
    c.finish(f'{OUT}/pirates-plage.png', vignette=0.22)


def jungle():
    c = Canvas(W, H, seed=45)
    c.vgrad(hexc('#2F6A60'), hexc('#133A3A'), 0, H)
    for k in range(4):
        col = ['#1D4A48', '#236058', '#1A4240', '#2C6E60'][k]
        for _ in range(14):
            x, y = c.rng.uniform(-50, 1250), c.rng.uniform(0, 460)
            r = c.rng.uniform(60, 140)
            blob = [(x + r * math.cos(t) * (1 + 0.15 * math.sin(6 * t)), y + r * 0.7 * math.sin(t)) for t in [i / 30 * 2 * math.pi for i in range(31)]]
            c.wash(blob, hexc(col, 230), wobble=2, blur=0.6)
    for x in (140, 380, 980, 1120):
        c.wash([(x - 16, 640), (x - 10, 0), (x + 10, 0), (x + 16, 640)], hexc('#3A2E24', 255), wobble=0.6, blur=0.3)
        c.ink([(x - 16, 640), (x - 10, 0)], width=1.6)
        c.ink([(x + 16, 640), (x + 10, 0)], width=1.6)
    # Lianes.
    for x in (240, 520, 820, 1060):
        c.ink([(x + 20 * math.sin(y / 60), y) for y in range(0, 340, 20)], width=2.4, color=hexc('#4E6B35', 255))
    # Arbre foudroyé.
    trunk = [(560, 520), (580, 240), (540, 170), (590, 200), (620, 120), (640, 210), (690, 170), (650, 260), (660, 520)]
    c.wash(trunk, hexc('#2A2420', 255), wobble=1, blur=0.2)
    c.ink(trunk, width=2, closed=True)
    c.ink([(600, 250), (612, 330), (598, 420)], width=3, color=hexc('#8A7A6A', 255))
    # Sol et coffre déterré.
    ground = [(-20, 640), (-20, 500), (1220, 480), (1220, 640)]
    c.wash(ground, hexc('#3E3226', 255), wobble=1, blur=0.3)
    hole = c.ellipse_pts(820, 560, 170, 40, 40)
    c.wash(hole, hexc('#1E1812', 255), wobble=1, blur=0.3)
    chest(c, 820, 590, w=200, h=90, open_=False)
    c.ink([(1000, 600), (1080, 400)], width=6, color=hexc('#8A5A32', 255))
    c.wash([(990, 600), (1016, 606), (1006, 640), (980, 634)], hexc('#9BA3AA', 255), wobble=0.3, blur=0.1)
    # Rais de lumière.
    for x in (300, 700):
        c.wash([(x, 0), (x + 60, 0), (x + 200, 640), (x + 100, 640)], hexc('#E8F4C8', 40), wobble=0, blur=10, edge=False)
    c.finish(f'{OUT}/pirates-jungle.png', vignette=0.3)


def grotte():
    c = Canvas(W, H, seed=46)
    c.vgrad(hexc('#2A2622'), hexc('#141210'), 0, H)
    c.glow(600, 420, 380, hexc('#E08A3C', 100))
    # Parois et stalactites.
    left = [(-20, -20), (260, -20), (220, 200), (300, 380), (200, 520), (260, 660), (-20, 660)]
    right = [(1220, -20), (940, -20), (990, 240), (900, 400), (1000, 520), (950, 660), (1220, 660)]
    for p in (left, right):
        c.wash(p, hexc('#3A342E', 255), wobble=3, blur=0.3)
        c.hatch(p, spacing=5, angle=60, alpha=120)
        c.ink(p, width=2, closed=True)
    for k in range(14):
        x = 200 + k * 60 + c.rng.uniform(-20, 20)
        h = c.rng.uniform(40, 130)
        st = [(x - 16, -5), (x, h), (x + 16, -5)]
        c.wash(st, hexc('#4A423A', 255), wobble=0.6, blur=0.2)
        c.ink(st, width=1.4)
    floor = [(-20, 640), (-20, 540), (1220, 540), (1220, 640)]
    c.wash(floor, hexc('#2E2822', 255), wobble=1, blur=0.3)
    chest(c, 600, 560, w=280, h=130, open_=True)
    # Torches aux parois.
    for x, y in [(260, 300), (940, 300)]:
        c.ink([(x, y), (x + (20 if x < 600 else -20), y + 60)], width=6, color=hexc('#5E3A1E', 255))
        c.glow(x, y - 20, 140, hexc('#FF9A3C', 170))
        flame = [(x - 12, y), (x, y - 50), (x + 12, y)]
        c.wash(flame, hexc('#FFC45C', 255), wobble=2, blur=0.8)
    c.wash(c.ellipse_pts(600, 470, 10, 10, 16), hexc('#F2C94C', 255), wobble=0.2, blur=0.2)
    c.finish(f'{OUT}/pirates-grotte.png', vignette=0.35)


if __name__ == '__main__':
    only = sys.argv[2:] or ['cale', 'pont', 'mer', 'tempete', 'plage', 'jungle', 'grotte']
    for name in only:
        globals()[name]()
