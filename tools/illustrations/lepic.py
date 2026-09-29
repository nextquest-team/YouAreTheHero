import math
import sys

from kit import INK, Canvas, hexc

OUT = sys.argv[1] if len(sys.argv) > 1 else 'out'


def dome(c, cx, base, r, h, color='#F4EEE2'):
    pts = [(cx - r, base)] + [(cx + r * math.cos(math.pi - math.pi * t), base - h * math.sin(math.pi * t) ** 0.8 - (h * 0.25) * max(0, 1 - abs(2 * t - 1) * 3)) for t in [i / 30 for i in range(31)]] + [(cx + r, base)]
    c.wash(pts, hexc(color, 255), wobble=0.4, blur=0.3)
    c.hatch(pts[len(pts) // 2:] + [(cx, base)], spacing=4, angle=75, alpha=70)
    c.ink(pts, width=1.6)
    top = min(y for _, y in pts)
    lantern = [(cx - r * 0.12, top + 2), (cx - r * 0.12, top - h * 0.28), (cx + r * 0.12, top - h * 0.28), (cx + r * 0.12, top + 2)]
    c.wash(lantern, hexc(color, 255), wobble=0.2, blur=0.1)
    c.ink(lantern, width=1.2, closed=True)
    c.ink([(cx, top - h * 0.28), (cx, top - h * 0.45)], width=1.4)
    return top


def sacre_coeur(c, cx, base, s=1.0):
    body = [(cx - 150 * s, base), (cx - 150 * s, base - 60 * s), (cx + 150 * s, base - 60 * s), (cx + 150 * s, base)]
    c.wash(body, hexc('#F1EADC', 255), wobble=0.5, blur=0.3)
    c.ink(body, width=1.6, closed=True)
    for k in range(-2, 3):
        ax = cx + k * 26 * s
        arch = c.ellipse_pts(ax, base - 30 * s, 9 * s, 12 * s, 16, math.pi, 2 * math.pi) + [(ax + 9 * s, base), (ax - 9 * s, base)]
        c.wash(arch, hexc('#8B7E9C', 230), wobble=0.2, blur=0.1, edge=False)
    drum = [(cx - 52 * s, base - 60 * s), (cx - 52 * s, base - 120 * s), (cx + 52 * s, base - 120 * s), (cx + 52 * s, base - 60 * s)]
    c.wash(drum, hexc('#F1EADC', 255), wobble=0.4, blur=0.2)
    c.ink(drum, width=1.4, closed=True)
    for k in range(-3, 4):
        c.ink([(cx + k * 14 * s, base - 70 * s), (cx + k * 14 * s, base - 110 * s)], width=1.0, color=INK + (160,))
    for dx in (-110, 110):
        dome(c, cx + dx * s, base - 60 * s, 30 * s, 60 * s)
    dome(c, cx, base - 120 * s, 58 * s, 120 * s)
    # Campanile.
    bx = cx + 190 * s
    tower = [(bx - 20 * s, base), (bx - 20 * s, base - 170 * s), (bx + 20 * s, base - 170 * s), (bx + 20 * s, base)]
    c.wash(tower, hexc('#EDE5D5', 255), wobble=0.3, blur=0.2)
    c.ink(tower, width=1.4, closed=True)
    c.wash([(bx - 9 * s, base - 150 * s), (bx + 9 * s, base - 150 * s), (bx + 9 * s, base - 120 * s), (bx - 9 * s, base - 120 * s)], hexc('#8B7E9C', 230), wobble=0.1, blur=0.1, edge=False)
    dome(c, bx, base - 170 * s, 20 * s, 40 * s)


def lamp(c, x, base, h=250, lit=True):
    c.ink([(x, base), (x, base - h)], width=4.2)
    c.ink([(x - 8, base), (x + 8, base)], width=6)
    c.ink([(x - 5, base - h * 0.35), (x + 5, base - h * 0.35)], width=3)
    top = base - h
    if lit:
        c.glow(x, top - 20, 90, hexc('#FFD27A', 150))
    lantern = [(x - 16, top - 6), (x - 22, top - 44), (x + 22, top - 44), (x + 16, top - 6)]
    c.wash(lantern, hexc('#FFE6A6' if lit else '#6C6478', 255), wobble=0.3, blur=0.2, edge=False)
    c.ink(lantern, width=2, closed=True)
    c.ink([(x - 26, top - 44), (x, top - 58), (x + 26, top - 44)], width=2.4, closed=True)
    c.ink([(x, top - 6), (x, top - 44)], width=1.2)


def building(c, x0, x1, top_y, color, side='left', rows=6):
    pts = [(x0, 1040), (x0, top_y), (x1, top_y + (40 if side == 'left' else -40)), (x1, 1040)]
    c.wash(pts, hexc(color, 255), wobble=0.8, blur=0.4)
    c.ink(pts[1:3], width=1.8)
    # Toit en zinc.
    roof = [(x0, top_y), (x1, top_y + (40 if side == 'left' else -40)), (x1, top_y + (40 if side == 'left' else -40) - 26), (x0, top_y - 26)]
    c.wash(roof, hexc('#7D8796', 255), wobble=0.4, blur=0.2)
    c.hatch(roof, spacing=5, angle=90, alpha=90)
    c.ink(roof, width=1.6, closed=True)
    w = x1 - x0
    slope = (40 if side == 'left' else -40) / w
    for r in range(rows):
        for k in range(2):
            wx = x0 + w * (0.22 + 0.42 * k)
            wy = top_y + slope * (wx - x0) + 36 + r * 78
            if wy > (760 if x0 < 0 else 900):
                continue
            win = [(wx, wy), (wx + w * 0.2, wy + slope * w * 0.2), (wx + w * 0.2, wy + 48 + slope * w * 0.2), (wx, wy + 48)]
            lit = (r * 3 + k) % 4 == 1
            c.wash(win, hexc('#FFD98A' if lit else '#4D4A66', 250), wobble=0.2, blur=0.2, edge=False)
            c.ink(win, width=1.2, closed=True)
            c.ink([(wx - 3, wy + 50), (wx + w * 0.2 + 3, wy + 50 + slope * w * 0.2)], width=2.6)
            for b in range(5):
                bx = wx + w * 0.2 * b / 4
                c.ink([(bx, wy + 40 + slope * (bx - wx)), (bx, wy + 50 + slope * (bx - wx))], width=1)


def cover():
    c = Canvas(1024, 1024, seed=14)
    c.vgrad(hexc('#3E3563'), hexc('#C77A8A'), 0, 420)
    c.vgrad(hexc('#C77A8A'), hexc('#F2BE95'), 420, 560)
    c.dots(40, (200, 0, 820, 200), hexc('#F3EBDB', 200), 0.6, 1.5)
    c.cloud(300, 170, 280, 20, hexc('#9E6C8E', 160))
    c.cloud(760, 110, 240, 18, hexc('#8C6591', 150))
    # Butte et Sacré-Cœur.
    butte = [(180, 600), (260, 470), (512, 432), (760, 470), (840, 600)]
    c.wash(butte, hexc('#6A6E4F', 255), wobble=1, blur=0.4)
    c.hatch(butte, spacing=6, angle=-40, alpha=80)
    sacre_coeur(c, 500, 450, s=0.9)
    # Arbres sur la butte.
    for tx, ty, r in [(270, 540, 46), (330, 560, 40), (700, 556, 42), (760, 536, 48), (230, 580, 36), (800, 580, 38)]:
        blob = [(tx + r * math.cos(t) * (1 + 0.12 * math.sin(5 * t)), ty + r * 0.85 * math.sin(t) * (1 + 0.12 * math.cos(4 * t))) for t in [i / 30 * 2 * math.pi for i in range(31)]]
        c.wash(blob, hexc('#3F5A3A', 255), wobble=1.5, blur=0.4)
        c.hatch(blob, spacing=5, angle=-50, alpha=100)
        c.ink(blob, width=1.4, closed=True, color=INK + (180,))
    # Murets de pierre couverts de lierre, de chaque côté des marches.
    for side in (-1, 1):
        X = lambda v: 512 + side * v
        wall = [(X(82), 560), (X(262), 560), (X(262), 1040), (X(262), 1040), (X(262), 1040), (X(262), 1040)]
        wall = [(X(82), 560), (X(262), 560), (X(262), 1040), (X(262), 1040)]
        wall = [(X(82), 560), (X(290), 560), (X(290), 1040), (X(262), 1040)]
        c.wash(wall, hexc('#C7B79E', 255), wobble=0.6, blur=0.3)
        for k in range(14):
            y = 580 + k * 34
            t = (y - 560) / 480
            xin = 82 + 180 * t
            c.ink([(X(xin), y), (X(290), y)], width=1.0, color=INK + (90,))
            for j in range(4):
                bx = xin + (290 - xin) * (j + (k % 2) * 0.5) / 4
                c.ink([(X(bx), y), (X(bx), y + 34)], width=0.9, color=INK + (70,))
        c.ink([(X(82), 560), (X(262), 1040)], width=2.2)
        # Lierre : des grappes de petites feuilles qui retombent du haut du muret.
        for k in range(260):
            vy = c.rng.uniform(0, 1) ** 1.6
            y = 566 + vy * 380
            t = (y - 560) / 480
            xin = 82 + 180 * t
            x = c.rng.uniform(max(xin + 10, 190 - 40 * vy), 290)
            r = c.rng.uniform(4, 8)
            col = c.rng.choice(['#3F5A2E', '#4E6B35', '#5E7F43', '#6E8F4E'])
            c.wash(c.ellipse_pts(X(x), y, r, r * 0.8, 10), hexc(col, 240), wobble=0.6, blur=0.2, edge=False)
    # Escaliers qui montent au centre.
    stairs = [(250, 1040), (430, 560), (594, 560), (774, 1040)]
    c.wash(stairs, hexc('#B7AFA4', 255), wobble=0.6, blur=0.3)
    y = 560
    step = 10
    while y < 1040:
        t = (y - 560) / 480
        xl = 430 - 180 * t
        xr = 594 + 180 * t
        c.ink([(xl, y), (xr, y)], width=1.0 + 1.6 * t, color=INK + (int(90 + 120 * t),))
        c.wash([(xl, y), (xr, y), (xr, y + step * 0.35), (xl, y + step * 0.35)], hexc('#8F877D', 120), wobble=0, blur=0.2, edge=False)
        step = 10 + 36 * t
        y += step
    # Rampe centrale.
    c.ink([(512, 560), (512, 1040)], width=4)
    for k in range(12):
        yy = 580 + k * 40
        c.ink([(512, yy), (512, yy + 3)], width=8)
    # Immeubles de part et d'autre.
    building(c, -20, 250, 320, '#EFE2CB', side='left', rows=6)
    building(c, 774, 1044, 360, '#E7D3BE', side='right')
    # Vitrine de librairie au pied de l'immeuble de gauche, store rouge.
    shop = [(-20, 860), (250, 860), (250, 1040), (-20, 1040)]
    c.wash(shop, hexc('#2F4A3A', 255), wobble=0.4, blur=0.2)
    c.ink(shop, width=2, closed=True)
    glass = [(10, 900), (220, 900), (220, 1040), (10, 1040)]
    c.wash(glass, hexc('#F6D48C', 250), wobble=0.3, blur=0.2, edge=False)
    c.glow(115, 960, 90, hexc('#FFD98A', 120))
    for k in range(5):
        by = 930 + k * 24
        c.ink([(20, by), (210, by)], width=1.6, color=hexc('#6B3E22', 230))
        x = 24
        while x < 206:
            w = 5 + (x * 7) % 6
            col = ['#B3321F', '#34466E', '#2E6030', '#7A4FA8', '#C98A2E'][(x // 7 + k) % 5]
            c.wash([(x, by - 2), (x + w, by - 2), (x + w, by - 18), (x, by - 18)], hexc(col, 240), wobble=0, blur=0, edge=False)
            x += w + 2
    awning = [(-20, 840), (270, 840), (250, 880), (-20, 880)]
    c.wash(awning, hexc('#B3321F', 255), wobble=0.3, blur=0.2)
    for k in range(0, 270, 30):
        c.wash([(k - 20, 840), (k - 5, 840), (k - 7, 880), (k - 20, 880)], hexc('#F3EBDB', 230), wobble=0.1, blur=0.1, edge=False)
    c.ink(awning, width=2, closed=True)
    for k in range(0, 270, 18):
        c.ink(c.ellipse_pts(k - 11, 880, 9, 8, 10, 0, math.pi), width=1.4)
    # Lampadaires.
    lamp(c, 300, 880, h=380)
    lamp(c, 724, 880, h=380)
    lamp(c, 440, 640, h=150)
    lamp(c, 584, 640, h=150)
    # Lettre au premier plan avec un brin de violette.
    lx, ly = 600, 900
    a = math.radians(-12)
    R = lambda px, py: (lx + px * math.cos(a) - py * math.sin(a), ly + px * math.sin(a) + py * math.cos(a))
    env = [R(-110, -70), R(110, -70), R(110, 70), R(-110, 70)]
    c.wash([(x + 8, y + 10) for x, y in env], hexc('#3A2E2A', 90), wobble=0, blur=4, edge=False)
    c.wash(env, hexc('#FBF3E3', 255), wobble=0.4, blur=0.2)
    c.ink(env, width=2, closed=True)
    c.ink([R(-110, -70), R(0, 10), R(110, -70)], width=1.4)
    for k in range(3):
        c.ink([R(-80, 20 + k * 14), R(-10 - k * 14, 20 + k * 14)], width=1.4, color=hexc('#34466E', 200))
    seal = c.ellipse_pts(*R(0, 10), 18, 18, 24)
    c.wash(seal, hexc('#B3321F', 255), wobble=1, blur=0.3)
    c.ink(c.ellipse_pts(*R(0, 10), 9, 9, 16), width=1.2, color=hexc('#7A1E12', 255))
    sx, sy = R(60, 40)
    c.ink([(sx, sy), (sx + 70, sy - 90)], width=2.2, color=hexc('#4E6B35', 255))
    c.ink([(sx + 30, sy - 40), (sx + 52, sy - 36)], width=2, color=hexc('#4E6B35', 255))
    leaf = [(sx + 20, sy - 20), (sx - 10, sy - 44), (sx - 20, sy - 20), (sx + 6, sy - 12)]
    c.wash(leaf, hexc('#5E7F43', 255), wobble=0.4, blur=0.2)
    c.ink(leaf, width=1.2, closed=True)
    for fx, fy in [(sx + 70, sy - 92), (sx + 56, sy - 38), (sx + 82, sy - 70)]:
        for k in range(5):
            ang = k * 2 * math.pi / 5
            p = c.ellipse_pts(fx + 9 * math.cos(ang), fy + 9 * math.sin(ang), 7, 7, 12)
            c.wash(p, hexc('#7A4FA8', 255), wobble=0.2, blur=0.2, edge=False)
        c.wash(c.ellipse_pts(fx, fy, 4, 4, 10), hexc('#F2C94C', 255), wobble=0, blur=0.1, edge=False)
    c.finish(f'{OUT}/lepic-couverture.png', vignette=0.26)


if __name__ == '__main__':
    cover()
