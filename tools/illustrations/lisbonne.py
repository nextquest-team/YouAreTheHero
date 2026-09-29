import math
import sys

from kit import INK, Canvas, hexc

OUT = sys.argv[1] if len(sys.argv) > 1 else 'out'

FACADES = ['#E8B04B', '#D9826B', '#F1D9A8', '#9CB7C9', '#E6A39A', '#F3E6CF', '#C9D4A6']


def house(c, x, base, w, h, color, roof='#B5523A', windows=True, rng=None):
    body = [(x, base), (x, base - h), (x + w, base - h), (x + w, base)]
    c.wash(body, hexc(color, 250), wobble=1.2, blur=0.5)
    roof_pts = [(x - 6, base - h + 2), (x + w * 0.5, base - h - w * 0.28), (x + w + 6, base - h + 2)]
    c.wash(roof_pts, hexc(roof, 250), wobble=1, blur=0.4)
    c.hatch(roof_pts, spacing=5, angle=-35, alpha=90)
    c.ink(body[1:3] + [body[3]], width=1.5)
    c.ink(body[:2], width=1.5)
    c.ink(roof_pts, width=1.5, closed=True)
    if not windows:
        return
    cols = max(1, int(w // 26))
    rows = max(1, int(h // 34))
    for r in range(rows):
        for k in range(cols):
            wx = x + (k + 0.5) * w / cols - 6
            wy = base - h + 14 + r * (h - 18) / rows
            win = [(wx, wy), (wx + 12, wy), (wx + 12, wy + 17), (wx, wy + 17)]
            lit = (rng.random() < 0.35) if rng else False
            c.wash(win, hexc('#F7D77A' if lit else '#3A4A5C', 240), wobble=0.3, blur=0.2, edge=False)
            c.ink(win, width=1.0, closed=True)
    # Petite bande d'azulejos au bas de la façade.
    if w > 60:
        for k in range(int(w // 10)):
            tx = x + 2 + k * 10
            c.wash([(tx, base - 12), (tx + 8, base - 12), (tx + 8, base - 4), (tx, base - 4)],
                   hexc('#2F5C99' if k % 2 else '#F3EBDB', 230), wobble=0.2, blur=0.1, edge=False)


def tram(c, x, y, s=1.0, angle=-14):
    """Tramway 28 : caisse jaune, toit blanc, trolley. Dessiné incliné pour suivre la pente."""
    a = math.radians(angle)
    ca, sa = math.cos(a), math.sin(a)
    R = lambda px, py: (x + (px * ca - py * sa) * s, y + (px * sa + py * ca) * s)
    body = [R(-150, 0), R(150, 0), R(150, -120), R(-150, -120)]
    c.wash(body, hexc('#F2B925', 255), wobble=0.8, blur=0.3)
    c.wash([R(-150, -40), R(150, -40), R(150, 0), R(-150, 0)], hexc('#D89A12', 200), wobble=0.5, blur=0.3, edge=False)
    c.wash([R(-156, -120), R(156, -120), R(146, -140), R(-146, -140)], hexc('#F3EBDB', 255), wobble=0.5, blur=0.2)
    c.ink([R(-156, -120), R(156, -120), R(146, -140), R(-146, -140)], width=2, closed=True)
    for k in range(6):
        wx = -136 + k * 46
        win = [R(wx, -108), R(wx + 36, -108), R(wx + 36, -58), R(wx, -58)]
        c.wash(win, hexc('#F6DE9A', 250), wobble=0.3, blur=0.2, edge=False)
        c.ink(win, width=1.4, closed=True)
    c.wash([R(-44, -24), R(44, -24), R(44, -14), R(-44, -14)], hexc('#1D1A16', 240), wobble=0.2, blur=0.1, edge=False)
    c.ink(body, width=2.4, closed=True)
    c.ink([R(-150, -40), R(150, -40)], width=1.3)
    for wx in (-100, 100):
        c.wash(c.ellipse_pts(*R(wx, 6), 16 * s, 16 * s, 24), hexc('#1D1A16', 255), wobble=0.2, blur=0.1, edge=False)
    c.ink([R(-60, -140), R(40, -260)], width=2)
    c.ink([R(40, -260), R(70, -262)], width=2)
    # Numéro 28 sur un bandeau.
    c.wash([R(-24, -136), R(24, -136), R(24, -124), R(-24, -124)], hexc('#1D1A16', 255), wobble=0.1, blur=0.1, edge=False)


def mix(c1, c2, t):
    a, b = hexc(c1), hexc(c2)
    return '#%02X%02X%02X' % tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))


def hill_y(x, row):
    """Ligne de la colline : elle monte vers la droite, chaque rang est plus bas."""
    return 700 - x * 0.2 + row * 95 + 18 * math.sin(x / 130 + row)


def cover():
    c = Canvas(1024, 1024, seed=5)
    c.vgrad(hexc('#F2C08C'), hexc('#EC977E'), 0, 470)
    c.vgrad(hexc('#EC977E'), hexc('#F7D6A2'), 470, 600)
    c.glow(300, 470, 240, hexc('#FFE2A6', 200))
    c.wash(c.ellipse_pts(300, 470, 58, 58), hexc('#FCE9BA', 255), wobble=0.4, blur=0.8, edge=False)
    c.cloud(760, 230, 380, 34, hexc('#F7D1B4', 190))
    c.cloud(180, 300, 260, 22, hexc('#F9DCC0', 170))
    c.cloud(620, 380, 200, 16, hexc('#F9DCC0', 150))
    # Le Tage, à gauche, sous la colline.
    c.vgrad(hexc('#F4BD95'), hexc('#B98076'), 560, 760)
    for k in range(9):
        y = 572 + k * 12
        w = 70 - k * 5
        c.ink([(300 - w, y), (300 + w, y)], width=1.6, color=hexc('#FCE7B5', 170 - k * 16))
    bridge_col = hexc('#A8452F', 235)
    towers = (140, 420)
    for px in towers:
        c.wash([(px - 7, 566), (px + 7, 566), (px + 5, 468), (px - 5, 468)], bridge_col, wobble=0.3, blur=0.3, edge=False)
    c.wash([(-20, 556), (620, 548), (620, 556), (-20, 564)], bridge_col, wobble=0.2, blur=0.2, edge=False)
    spans = [(-20, towers[0], 'up'), (towers[0], towers[1], 'sag'), (towers[1], 620, 'down')]
    for a, b, kind in spans:
        pts = []
        for i in range(21):
            t = i / 20
            if kind == 'up':
                y = 556 - 86 * t ** 1.7
            elif kind == 'down':
                y = 470 + 80 * t ** 1.7
            else:
                y = 470 + 80 * (1 - (2 * t - 1) ** 2)
            pts.append((a + (b - a) * t, y))
        c.ink(pts, width=1.8, color=bridge_col)
        for i in range(2, 20, 2):
            x, y = pts[i]
            c.ink([(x, y), (x, 554)], width=0.8, color=hexc('#A8452F', 150))
    # Colline de maisons : du fond (brumeux) vers l'avant (net).
    rng = c.rng
    for row, (hmin, hmax, wmin, wmax, haze) in enumerate([(60, 90, 44, 70, 0.45), (80, 120, 60, 95, 0.22), (110, 160, 80, 130, 0.0)]):
        x = 380 - row * 190 + rng.uniform(-20, 20)
        while x < 1060:
            w = rng.uniform(wmin, wmax)
            h = rng.uniform(hmin, hmax)
            base = hill_y(x + w / 2, row)
            col = mix(rng.choice(FACADES), '#F2C3A0', haze)
            roof = mix(rng.choice(['#B5523A', '#C4674A', '#A8452F']), '#F2C3A0', haze)
            house(c, x, base + 60, w, h + 60, col, roof=roof, rng=rng)
            x += w + rng.uniform(-8, 2)
        if row == 0:
            # Clocher en haut de la colline.
            tx, tb = 860, hill_y(860, 0) - 60
            tower = [(tx - 26, tb + 60), (tx - 26, tb - 120), (tx + 26, tb - 120), (tx + 26, tb + 60)]
            c.wash(tower, hexc(mix('#F3E6CF', '#F2C3A0', 0.3), 250), wobble=0.6, blur=0.3)
            c.ink(tower, width=1.4, closed=True)
            c.wash(c.ellipse_pts(tx, tb - 120, 30, 34, 30, math.pi, 2 * math.pi), hexc(mix('#C9D4A6', '#F2C3A0', 0.3), 250), wobble=0.4, blur=0.3)
            c.ink(c.ellipse_pts(tx, tb - 120, 30, 34, 30, math.pi, 2 * math.pi), width=1.4)
            c.ink([(tx, tb - 154), (tx, tb - 180)], width=1.6)
            c.ink([(tx - 8, tb - 170), (tx + 8, tb - 170)], width=1.6)
            arch = c.ellipse_pts(tx, tb - 80, 10, 16, 20, math.pi, 2 * math.pi) + [(tx + 10, tb - 50), (tx - 10, tb - 50)]
            c.wash(arch, hexc('#3A4A5C', 240), wobble=0.2, blur=0.1, edge=False)
    # La rue pavée en pente et le tram.
    street = [(-20, 1040), (-20, 900), (1044, 770), (1044, 1040)]
    c.wash(street, hexc('#CDBFA6', 255), wobble=1, blur=0.5)
    for k in range(-6, 40):
        x0 = k * 30
        c.ink([(x0, 905 - x0 * 0.127), (x0 - 60, 1040)], width=0.8, color=INK + (45,))
    for k in range(14):
        y0 = 910 + k * 10
        c.ink([(-20, y0), (1044, y0 - 130)], width=0.8, color=INK + (45,))
    rail = lambda y: [(-20, y), (1044, y - 130)]
    c.ink(rail(960), width=2.4, color=hexc('#6E6254', 230))
    c.ink(rail(990), width=2.4, color=hexc('#6E6254', 230))
    angle = math.degrees(math.atan(-130 / 1064))
    tram(c, 560, 975 - 560 * 0.122 - 22, s=1.2, angle=angle)
    c.ink([(-20, 590), (1044, 470)], width=1.4, color=INK + (200,))
    # Bande d'azulejos en bas.
    for k in range(0, 1024, 64):
        tile = [(k, 968), (k + 64, 968), (k + 64, 1032), (k, 1032)]
        c.wash(tile, hexc('#F3EBDB', 255), wobble=0, blur=0, edge=False)
        cx, cy = k + 32, 1000
        c.wash([(cx, cy - 24), (cx + 24, cy), (cx, cy + 24), (cx - 24, cy)], hexc('#2F5C99', 240), wobble=0.5, blur=0.3, edge=False)
        c.wash(c.ellipse_pts(cx, cy, 8, 8, 20), hexc('#F3EBDB', 255), wobble=0.2, blur=0.1, edge=False)
        c.ink(tile, width=1.2, closed=True, color=hexc('#2F5C99', 220))
    c.finish(f'{OUT}/lisbonne-couverture.png', vignette=0.2)


if __name__ == '__main__':
    cover()
