import math
import sys

from bg_lepic import couple, string_lights
from kit import INK, Canvas, hexc
from lisbonne import FACADES, house, mix, tram

OUT = sys.argv[1] if len(sys.argv) > 1 else 'out'
W, H = 1200, 640
BLUE = '#2F5C99'


def tile(c, x, y, s, variant=0):
    sq = [(x, y), (x + s, y), (x + s, y + s), (x, y + s)]
    c.wash(sq, hexc('#F7F0E2', 255), wobble=0.1, blur=0.1, edge=False)
    cx, cy = x + s / 2, y + s / 2
    if variant % 3 == 0:
        c.wash([(cx, y + 4), (x + s - 4, cy), (cx, y + s - 4), (x + 4, cy)], hexc(BLUE, 240), wobble=0.4, blur=0.2, edge=False)
        c.wash(c.ellipse_pts(cx, cy, s * 0.14, s * 0.14, 16), hexc('#E8B04B', 255), wobble=0.2, blur=0.1, edge=False)
    elif variant % 3 == 1:
        for a in range(4):
            ang = a * math.pi / 2 + math.pi / 4
            c.wash(c.ellipse_pts(cx + s * 0.22 * math.cos(ang), cy + s * 0.22 * math.sin(ang), s * 0.16, s * 0.16, 16), hexc(BLUE, 230), wobble=0.3, blur=0.2, edge=False)
    else:
        for corner in ((x, y), (x + s, y), (x + s, y + s), (x, y + s)):
            c.wash(c.ellipse_pts(corner[0], corner[1], s * 0.3, s * 0.3, 20), hexc(BLUE, 220), wobble=0.3, blur=0.2, edge=False)
        c.wash(c.ellipse_pts(cx, cy, s * 0.12, s * 0.12, 16), hexc(BLUE, 240), wobble=0.2, blur=0.1, edge=False)
    c.ink(sq, width=1, closed=True, color=hexc(BLUE, 160))


def tile_wall(c, x0, y0, x1, y1, s, pattern=None):
    y = y0
    r = 0
    while y < y1:
        x = x0
        k = 0
        while x < x1:
            tile(c, x, y, s, pattern if pattern is not None else (r + k) % 3)
            x += s
            k += 1
        y += s
        r += 1


def laundry(c, x0, x1, y, sag=30):
    pts = [(x0 + (x1 - x0) * t, y + sag * 4 * t * (1 - t)) for t in [i / 20 for i in range(21)]]
    c.ink(pts, width=1.2)
    cols = ['#F3EBDB', '#D9826B', '#9CB7C9', '#E8B04B', '#F3EBDB']
    for k in range(1, 6):
        t = k / 6
        lx, ly = x0 + (x1 - x0) * t, y + sag * 4 * t * (1 - t)
        cloth = [(lx - 14, ly), (lx + 14, ly), (lx + 12, ly + 34), (lx - 12, ly + 36)]
        c.wash(cloth, hexc(cols[k - 1], 250), wobble=0.3, blur=0.2)
        c.ink(cloth, width=1.1, closed=True)


def rooftops(c, y0, haze, seed_rows=2):
    rng = c.rng
    for row in range(seed_rows):
        x = -30
        while x < 1230:
            w = rng.uniform(60, 120)
            h = rng.uniform(40, 90)
            base = y0 + row * 60 + 12 * math.sin(x / 90 + row)
            house(c, x, base + 80, w, h + 80, mix(rng.choice(FACADES), '#F2C3A0', haze * (1 - row * 0.5)),
                  roof=mix('#B5523A', '#F2C3A0', haze * (1 - row * 0.5)), rng=rng)
            x += w - 2


def alfama():
    c = Canvas(W, H, seed=60)
    c.vgrad(hexc('#9CC8DE'), hexc('#F4E3C4'), 0, 300)
    rooftops(c, 250, 0.4)
    # Ruelle étroite en escalier, façades de chaque côté.
    for x0, x1, col, top in ((-20, 300, '#E8B04B', 40), (900, 1220, '#9CB7C9', 20)):
        body = [(x0, 700), (x0, top), (x1, top + 40), (x1, 700)]
        c.wash(body, hexc(col, 255), wobble=0.6, blur=0.3)
        c.ink(body[1:3], width=2)
        inner = x1 if x0 < 0 else x0
        c.ink([(inner, top + (40 if x0 < 0 else 0)), (inner, 700)], width=2)
        for r in range(4):
            wy = top + 80 + r * 130
            wx = (x0 + x1) / 2 - 40
            win = [(wx, wy), (wx + 80, wy), (wx + 80, wy + 90), (wx, wy + 90)]
            c.wash(win, hexc('#3A4A5C', 240), wobble=0.2, blur=0.1)
            c.ink(win, width=1.6, closed=True)
            c.wash([(wx - 10, wy + 90), (wx + 90, wy + 90), (wx + 90, wy + 100), (wx - 10, wy + 100)], hexc('#2A2622', 255), wobble=0.1, blur=0.1)
            for b in range(8):
                c.ink([(wx - 6 + b * 13, wy + 70), (wx - 6 + b * 13, wy + 90)], width=1.2)
        tile_wall(c, x0 if x0 > 0 else 0, 560, x1 if x1 < 1200 else 1200, 640, 40)
    laundry(c, 300, 900, 120, 40)
    laundry(c, 300, 900, 260, 30)
    # Escalier pavé.
    for k in range(10):
        t = k / 9
        y = 420 + 220 * t
        half = 200 + 400 * t
        step = [(600 - half, y), (600 + half, y), (600 + half, y + 22), (600 - half, y + 22)]
        c.wash(step, hexc('#D8CCB8' if k % 2 else '#C8BCA6', 255), wobble=0.3, blur=0.2)
        c.ink([(600 - half, y), (600 + half, y)], width=1.4)
    # Pots de fleurs.
    for x, y in ((320, 460), (870, 470), (360, 560)):
        pot = [(x - 18, y), (x + 18, y), (x + 14, y + 30), (x - 14, y + 30)]
        c.wash(pot, hexc('#B5523A', 255), wobble=0.2, blur=0.1)
        c.ink(pot, width=1.4, closed=True)
        c.wash(c.ellipse_pts(x, y - 12, 26, 18, 20), hexc('#4A6B3A', 250), wobble=1, blur=0.3)
        c.dots(6, (x - 18, y - 26, x + 18, y - 4), hexc('#D9446B', 255), 3, 5)
    c.finish(f'{OUT}/lisbonne-alfama.png', vignette=0.22)


def toit():
    c = Canvas(W, H, seed=61)
    c.vgrad(hexc('#F2A67E'), hexc('#F7D6A2'), 0, 360)
    c.glow(260, 330, 220, hexc('#FFE2A6', 200))
    c.wash(c.ellipse_pts(260, 330, 46, 46), hexc('#FCE9BA', 255), wobble=0.3, blur=0.6, edge=False)
    c.cloud(760, 110, 380, 30, hexc('#F7D1B4', 190))
    # Tage et pont.
    c.vgrad(hexc('#F4BD95'), hexc('#B98076'), 330, 420)
    bridge = hexc('#A8452F', 220)
    for px in (300, 700):
        c.wash([(px - 6, 330), (px + 6, 330), (px + 5, 250), (px - 5, 250)], bridge, wobble=0.2, blur=0.3, edge=False)
    c.ink([(-20, 322), (1220, 318)], width=4, color=bridge)
    c.ink([(300 + 400 * t, 250 + 70 * (1 - (2 * t - 1) ** 2)) for t in [i / 20 for i in range(21)]], width=1.6, color=bridge)
    # Château São Jorge sur une colline à droite.
    hill = [(820, 360), (900, 250), (1060, 230), (1220, 260), (1220, 380)]
    c.wash(hill, hexc('#7A8A5A', 240), wobble=1, blur=0.4)
    for k in range(6):
        x = 900 + k * 50
        tw = [(x, 250), (x, 190 - (k % 2) * 30), (x + 34, 190 - (k % 2) * 30), (x + 34, 250)]
        c.wash(tw, hexc('#C8B89A', 250), wobble=0.4, blur=0.2)
        c.ink(tw, width=1.2, closed=True)
        for m in range(3):
            c.wash([(x + m * 12, 190 - (k % 2) * 30), (x + m * 12 + 7, 190 - (k % 2) * 30), (x + m * 12 + 7, 180 - (k % 2) * 30), (x + m * 12, 180 - (k % 2) * 30)], hexc('#C8B89A', 250), wobble=0.1, blur=0.1)
    rooftops(c, 340, 0.3)
    # Terrasse au premier plan : parapet, guirlande, deux chaises.
    terrace = [(-20, 640), (-20, 520), (1220, 520), (1220, 640)]
    c.wash(terrace, hexc('#C9A98A', 255), wobble=0.4, blur=0.2)
    for x in range(-20, 1220, 60):
        c.ink([(x, 520), (x - 40, 640)], width=1, color=INK + (70,))
    para = [(-20, 520), (1220, 520), (1220, 490), (-20, 490)]
    c.wash(para, hexc('#F3E6CF', 255), wobble=0.3, blur=0.2)
    c.ink(para, width=2, closed=True)
    string_lights(c, -20, 1220, 20, 80, 14)
    for x in (430, 740):
        seat = [(x - 34, 560), (x + 34, 560), (x + 30, 580), (x - 30, 580)]
        c.wash(seat, hexc('#2E6030', 255), wobble=0.2, blur=0.1)
        c.ink(seat, width=1.6, closed=True)
        c.ink([(x - 30, 580), (x - 34, 630)], width=3)
        c.ink([(x + 30, 580), (x + 34, 630)], width=3)
        c.ink([(x + (-30 if x < 600 else 30), 560), (x + (-36 if x < 600 else 36), 500)], width=3)
    # Petite table et deux verres.
    c.ink([(585, 560), (585, 630)], width=4)
    top = c.ellipse_pts(585, 556, 50, 12, 30)
    c.wash(top, hexc('#F3EBDB', 255), wobble=0.2, blur=0.1)
    c.ink(top, width=1.6, closed=True)
    for gx in (570, 602):
        g = [(gx - 6, 550), (gx + 6, 550), (gx + 5, 526), (gx - 5, 526)]
        c.wash(g, hexc('#E8B04B', 200), wobble=0.1, blur=0.1)
        c.ink(g, width=1.2, closed=True)
    c.finish(f'{OUT}/lisbonne-toit.png', vignette=0.22)


def cafe():
    c = Canvas(W, H, seed=62)
    c.vgrad(hexc('#F3E3C6'), hexc('#E6CFA6'), 0, H)
    tile_wall(c, 0, 300, 1200, 420, 60)
    c.ink([(0, 300), (1200, 300)], width=3)
    # Comptoir en bois, machine à espresso, pastéis.
    counter = [(-20, 640), (-20, 450), (1220, 450), (1220, 640)]
    c.wash(counter, hexc('#7A4A26', 255), wobble=0.4, blur=0.2)
    c.hatch(counter, spacing=7, angle=0, alpha=50)
    c.wash([(-20, 420), (1220, 420), (1220, 452), (-20, 452)], hexc('#E8DCC4', 255), wobble=0.2, blur=0.1)
    c.ink([(-20, 420), (1220, 420)], width=2)
    c.ink([(-20, 452), (1220, 452)], width=2)
    m = [(740, 420), (740, 250), (980, 250), (980, 420)]
    c.wash(m, hexc('#B8BCC0', 255), wobble=0.3, blur=0.2)
    c.hatch([(900, 420), (900, 250), (980, 250), (980, 420)], spacing=5, angle=90, alpha=80)
    c.ink(m, width=2, closed=True)
    c.wash([(760, 240), (960, 240), (960, 250), (760, 250)], hexc('#8C2F22', 255), wobble=0.1, blur=0.1)
    for gx in (800, 900):
        c.ink([(gx, 330), (gx, 360)], width=8)
        cup = [(gx - 16, 380), (gx + 16, 380), (gx + 12, 410), (gx - 12, 410)]
        c.wash(cup, hexc('#FBF6EC', 255), wobble=0.1, blur=0.1)
        c.ink(cup, width=1.4, closed=True)
    c.cloud(860, 220, 120, 30, hexc('#FFFFFF', 150), soft=6)
    # Vitrine de pastéis de nata.
    case = [(160, 420), (160, 330), (560, 330), (560, 420)]
    c.wash(case, hexc('#DDEAF0', 140), wobble=0.2, blur=0.1)
    c.ink(case, width=2, closed=True)
    for r in range(2):
        for k in range(6):
            px, py = 200 + k * 62, 360 + r * 36
            c.wash(c.ellipse_pts(px, py, 24, 12, 20), hexc('#C98530', 255), wobble=0.3, blur=0.1)
            c.wash(c.ellipse_pts(px, py - 2, 18, 8, 20), hexc('#F2C94C', 255), wobble=0.3, blur=0.1)
            c.dots(3, (px - 12, py - 8, px + 10, py + 2), hexc('#7A3A0E', 220), 1.5, 3)
            c.ink(c.ellipse_pts(px, py, 24, 12, 20), width=1.2, closed=True)
    # Étagère de bouteilles et ardoise.
    c.wash([(100, 180), (620, 180), (620, 192), (100, 192)], hexc('#5E3A1E', 255), wobble=0.2, blur=0.1)
    for k in range(12):
        bx = 120 + k * 42
        col = ['#2E6030', '#8C2F22', '#C49A3A'][k % 3]
        b = [(bx, 180), (bx, 120), (bx + 6, 104), (bx + 6, 84), (bx + 14, 84), (bx + 14, 104), (bx + 20, 120), (bx + 20, 180)]
        c.wash(b, hexc(col, 240), wobble=0.2, blur=0.1)
        c.ink(b, width=1.1, closed=True)
    slate = [(700, 60), (1080, 60), (1080, 210), (700, 210)]
    c.wash(slate, hexc('#2A2E2C', 255), wobble=0.3, blur=0.2)
    c.ink(slate, width=5, closed=True, color=hexc('#8A5A32', 255))
    for k in range(4):
        c.ink([(730, 94 + k * 30), (900 - k * 20, 94 + k * 30)], width=2, color=hexc('#F3EBDB', 200))
        c.ink([(1000, 94 + k * 30), (1050, 94 + k * 30)], width=2, color=hexc('#F3EBDB', 200))
    c.finish(f'{OUT}/lisbonne-cafe.png', vignette=0.25)


def fado():
    c = Canvas(W, H, seed=63)
    c.vgrad(hexc('#2A1E1A'), hexc('#140E0C'), 0, H)
    # Voûte en pierre.
    arch = c.ellipse_pts(600, 520, 560, 460, 60, math.pi, 2 * math.pi)
    c.wash(arch + [(1160, 640), (40, 640)], hexc('#4A3A30', 255), wobble=1, blur=0.3)
    for k in range(18):
        a = math.pi + k * math.pi / 17
        c.ink([(600 + 560 * math.cos(a), 520 + 460 * math.sin(a)), (600 + 520 * math.cos(a), 520 + 420 * math.sin(a))], width=1.4)
    c.ink(arch, width=2.4)
    c.glow(600, 360, 300, hexc('#FFB85C', 130))
    # Châle noir et guitare portugaise : une silhouette assise, sans visage.
    fx, fb = 480, 520
    body = [(fx - 60, fb), (fx - 50, fb - 130), (fx - 30, fb - 170), (fx + 30, fb - 170), (fx + 50, fb - 130), (fx + 60, fb)]
    c.wash(body, hexc('#1D1A16', 255), wobble=0.4, blur=0.2)
    c.ink(body, width=1.6, closed=True)
    head = c.ellipse_pts(fx, fb - 196, 24, 28, 24)
    c.wash(head, hexc('#2A2420', 255), wobble=0.2, blur=0.1)
    c.ink(head, width=1.6, closed=True)
    shawl = [(fx - 56, fb - 150), (fx + 56, fb - 150), (fx + 40, fb - 80), (fx, fb - 50), (fx - 40, fb - 80)]
    c.wash(shawl, hexc('#3A2A30', 255), wobble=0.4, blur=0.2)
    for k in range(8):
        c.ink([(fx - 40 + k * 11, fb - 80 + abs(k - 4) * 6), (fx - 40 + k * 11, fb - 62 + abs(k - 4) * 6)], width=1, color=hexc('#8A6A70', 200))
    # Guitare portugaise en poire.
    gx, gy = 700, 400
    g = c.ellipse_pts(gx, gy, 60, 72, 40)
    c.wash(g, hexc('#C49A3A', 255), wobble=0.3, blur=0.2)
    c.ink(g, width=2, closed=True)
    c.wash(c.ellipse_pts(gx, gy - 10, 16, 16, 20), hexc('#1D1A16', 255), wobble=0.1, blur=0.1)
    c.ink([(gx, gy - 70), (gx - 20, gy - 230)], width=10, color=hexc('#5E3A1E', 255))
    fan = [(gx - 20, gy - 230), (gx - 50, gy - 270), (gx + 10, gy - 280)]
    c.wash(fan, hexc('#D8B040', 255), wobble=0.2, blur=0.1)
    c.ink(fan, width=1.4, closed=True)
    for k in range(-2, 3):
        c.ink([(gx + k * 3, gy + 40), (gx - 20 + k * 2, gy - 230)], width=0.6, color=hexc('#F3EBDB', 200))
    # Bougies et tables.
    for tx in (160, 1040):
        top = c.ellipse_pts(tx, 560, 90, 20, 30)
        c.wash(top, hexc('#8C2F22', 255), wobble=0.3, blur=0.2)
        c.ink(top, width=1.6, closed=True)
        c.glow(tx, 520, 80, hexc('#FFC46A', 170))
        c.wash([(tx - 6, 550), (tx + 6, 550), (tx + 6, 520), (tx - 6, 520)], hexc('#F3EBDB', 255), wobble=0.1, blur=0.1)
        c.wash([(tx - 4, 520), (tx, 500), (tx + 4, 520)], hexc('#FFD27A', 255), wobble=0.3, blur=0.4, edge=False)
    c.finish(f'{OUT}/lisbonne-fado.png', vignette=0.35)


def azulejos():
    c = Canvas(W, H, seed=64)
    c.vgrad(hexc('#F3EBDB'), hexc('#E8DCC4'), 0, H)
    tile_wall(c, 0, 0, 1200, 640, 80)
    # Grand panneau peint : une caravelle bleue.
    panel = [(340, 80), (860, 80), (860, 480), (340, 480)]
    c.wash(panel, hexc('#F7F0E2', 255), wobble=0.2, blur=0.1)
    for y in range(80, 480, 40):
        c.ink([(340, y), (860, y)], width=0.6, color=hexc(BLUE, 90))
    for x in range(340, 860, 40):
        c.ink([(x, 80), (x, 480)], width=0.6, color=hexc(BLUE, 90))
    hull = [(430, 360), (770, 360), (730, 410), (470, 410)]
    c.wash(hull, hexc(BLUE, 240), wobble=0.5, blur=0.3)
    for mx, top in ((520, 150), (600, 120), (680, 170)):
        c.ink([(mx, 360), (mx, top)], width=3, color=hexc(BLUE, 255))
        sail = [(mx - 50, top + 30), (mx + 50, top + 30), (mx + 44, top + 150), (mx - 44, top + 150)]
        c.wash(sail, hexc('#DCE6F2', 255), wobble=0.4, blur=0.2)
        c.ink(sail, width=1.6, closed=True, color=hexc(BLUE, 255))
        c.ink([(mx - 12, top + 80), (mx + 12, top + 80)], width=3, color=hexc(BLUE, 255))
        c.ink([(mx, top + 68), (mx, top + 92)], width=3, color=hexc(BLUE, 255))
    for k in range(4):
        y = 420 + k * 14
        c.ink([(360 + x, y + 4 * math.sin(x / 20 + k)) for x in range(0, 480, 10)], width=1.6, color=hexc(BLUE, 220))
    c.ink(panel, width=6, closed=True, color=hexc('#E8B04B', 255))
    c.ink([(330, 70), (870, 70), (870, 490), (330, 490)], width=2, closed=True, color=hexc(BLUE, 255))
    # Un carreau manquant.
    c.wash([(1000, 400), (1080, 400), (1080, 480), (1000, 480)], hexc('#B8A88E', 255), wobble=0.3, blur=0.2)
    c.hatch([(1000, 400), (1080, 400), (1080, 480), (1000, 480)], spacing=5, angle=45, alpha=80)
    c.finish(f'{OUT}/lisbonne-azulejos.png', vignette=0.25)


def tram_bg():
    c = Canvas(W, H, seed=65)
    c.vgrad(hexc('#9CC8DE'), hexc('#F4E3C4'), 0, 330)
    rooftops(c, 220, 0.35)
    street = [(-20, 660), (-20, 520), (1220, 380), (1220, 660)]
    c.wash(street, hexc('#CDBFA6', 255), wobble=1, blur=0.4)
    for k in range(20):
        y0 = 530 + k * 8
        c.ink([(-20, y0), (1220, y0 - 140)], width=0.8, color=INK + (45,))
    c.ink([(-20, 580), (1220, 440)], width=2.4, color=hexc('#6E6254', 230))
    c.ink([(-20, 610), (1220, 470)], width=2.4, color=hexc('#6E6254', 230))
    c.ink([(-20, 90), (1220, -40)], width=1.2)
    angle = math.degrees(math.atan(-140 / 1240))
    tram(c, 620, 530, s=1.5, angle=angle)
    c.finish(f'{OUT}/lisbonne-tram.png', vignette=0.2)


def festa():
    c = Canvas(W, H, seed=66)
    c.vgrad(hexc('#1E2A4A'), hexc('#5A3A5A'), 0, 420)
    rooftops(c, 300, 0.0)
    # Fanions et guirlandes.
    for y, sag, cols in ((30, 70, ('#B3321F', '#E8B04B', '#2E6030')), (120, 60, ('#2F5C99', '#D9826B', '#F3EBDB'))):
        pts = [(-20 + 1240 * t, y + sag * 4 * t * (1 - t)) for t in [i / 30 for i in range(31)]]
        c.ink(pts, width=1.2)
        for k in range(24):
            t = (k + 0.5) / 24
            fx, fy = -20 + 1240 * t, y + sag * 4 * t * (1 - t)
            flag = [(fx - 14, fy), (fx + 14, fy), (fx, fy + 30)]
            c.wash(flag, hexc(cols[k % 3], 250), wobble=0.3, blur=0.1)
            c.ink(flag, width=1, closed=True)
    string_lights(c, -20, 1220, 200, 40, 16)
    # Grill à sardines et fumée.
    c.glow(900, 470, 160, hexc('#FF9A3C', 150))
    grill = [(800, 520), (1000, 520), (990, 560), (810, 560)]
    c.wash(grill, hexc('#3A3430', 255), wobble=0.2, blur=0.1)
    c.ink(grill, width=1.8, closed=True)
    for k in range(5):
        fx = 830 + k * 34
        fish = c.ellipse_pts(fx, 510, 14, 5, 16)
        c.wash(fish, hexc('#9CA8B0', 255), wobble=0.2, blur=0.1)
        c.ink(fish, width=1, closed=True)
    for k in range(4):
        c.cloud(900 + k * 20, 470 - k * 50, 120 + k * 30, 22, hexc('#D8D0C8', 120 - k * 20), soft=6)
    # Pots de basilic (manjerico) avec fleur en papier.
    for x in (180, 280):
        pot = [(x - 22, 560), (x + 22, 560), (x + 18, 600), (x - 18, 600)]
        c.wash(pot, hexc('#B5523A', 255), wobble=0.2, blur=0.1)
        c.ink(pot, width=1.4, closed=True)
        c.wash(c.ellipse_pts(x, 540, 30, 24, 20), hexc('#4A6B3A', 250), wobble=1, blur=0.3)
        c.wash(c.ellipse_pts(x + 10, 516, 10, 10, 12), hexc('#D9446B', 255), wobble=0.4, blur=0.1)
        c.ink([(x + 10, 526), (x + 10, 548)], width=1.2)
    c.vgrad(hexc('#6C5A50'), hexc('#3A302A'), 600, 640)
    couple(c, 520, 610, 0.9, col1='#2F5C99', col2='#E8B04B')
    couple(c, 680, 600, 0.8, col1='#8C2F22', col2='#4A6B3A')
    c.finish(f'{OUT}/lisbonne-festa.png', vignette=0.28)


if __name__ == '__main__':
    only = sys.argv[2:] or ['alfama', 'toit', 'cafe', 'fado', 'azulejos', 'tram_bg', 'festa']
    for name in only:
        globals()[name]()
