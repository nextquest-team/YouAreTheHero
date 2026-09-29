import math
import sys

from bg_lepic import string_lights
from cuisine import kouign, quimper
from kit import INK, Canvas, hexc

OUT = sys.argv[1] if len(sys.argv) > 1 else 'out'
W, H = 1200, 640


def gingham(c, pts_box, cell=24, col='#B3321F'):
    x0, y0, x1, y1 = pts_box
    c.wash([(x0, y0), (x1, y0), (x1, y1), (x0, y1)], hexc('#F7EEDD', 255), wobble=0.3, blur=0.2)
    x = x0
    while x < x1:
        c.wash([(x, y0), (min(x + cell / 2, x1), y0), (min(x + cell / 2, x1), y1), (x, y1)], hexc(col, 90), wobble=0.1, blur=0.1, edge=False)
        x += cell
    y = y0
    while y < y1:
        c.wash([(x0, y), (x1, y), (x1, min(y + cell / 2, y1)), (x0, min(y + cell / 2, y1))], hexc(col, 90), wobble=0.1, blur=0.1, edge=False)
        y += cell


def stall(c, x, w, base, awning_col, goods):
    table = [(x, base), (x, base - 70), (x + w, base - 70), (x + w, base)]
    c.wash(table, hexc('#8A5A32', 255), wobble=0.3, blur=0.2)
    c.ink(table, width=1.8, closed=True)
    for px in (x + 8, x + w - 8):
        c.ink([(px, 140), (px, base - 70)], width=4, color=hexc('#5E3A1E', 255))
    stripes = 8
    for k in range(stripes):
        sx = x - 10 + k * (w + 20) / stripes
        sw = (w + 20) / stripes
        strip = [(sx, 120), (sx + sw, 120), (sx + sw, 180), (sx + sw / 2, 196), (sx, 180)]
        c.wash(strip, hexc(awning_col if k % 2 == 0 else '#F7EEDD', 255), wobble=0.2, blur=0.1)
        c.ink(strip, width=1.1, closed=True)
    for k in range(int(w // 40)):
        gx = x + 24 + k * 40
        kind, col = goods[k % len(goods)]
        if kind == 'round':
            for d in range(3):
                c.wash(c.ellipse_pts(gx + (d - 1) * 10, base - 84 - (d % 2) * 12, 12, 12, 16), hexc(col, 255), wobble=0.3, blur=0.1)
                c.ink(c.ellipse_pts(gx + (d - 1) * 10, base - 84 - (d % 2) * 12, 12, 12, 16), width=1, closed=True)
        elif kind == 'block':
            b = [(gx - 16, base - 70), (gx - 16, base - 100), (gx + 16, base - 100), (gx + 16, base - 70)]
            c.wash(b, hexc(col, 255), wobble=0.2, blur=0.1)
            c.ink(b, width=1.2, closed=True)
        else:
            c.wash(c.ellipse_pts(gx, base - 86, 18, 16, 20), hexc(col, 255), wobble=1, blur=0.2)
            c.ink(c.ellipse_pts(gx, base - 86, 18, 16, 20), width=1, closed=True)


def cuisine():
    c = Canvas(W, H, seed=80)
    c.vgrad(hexc('#F3E8D2'), hexc('#E6D6B8'), 0, H)
    # Carrelage blanc et frise bleue.
    for y in range(240, 440, 40):
        c.ink([(0, y), (1200, y)], width=0.8, color=INK + (50,))
    for x in range(0, 1200, 40):
        c.ink([(x, 240), (x, 440)], width=0.8, color=INK + (50,))
    c.wash([(0, 228), (1200, 228), (1200, 240), (0, 240)], hexc('#2F5C99', 230), wobble=0.1, blur=0.1)
    # Fenêtre sur la mer et le phare.
    win = [(460, 40), (740, 40), (740, 220), (460, 220)]
    c.vgrad(hexc('#B8D4E0'), hexc('#E8EEF0'), 40, 160, mask=c.mask_poly(win))
    c.wash([(460, 160), (740, 160), (740, 220), (460, 220)], hexc('#5C8FA6', 240), wobble=0.3, blur=0.2)
    lh = [(650, 160), (656, 90), (672, 90), (678, 160)]
    c.wash(lh, hexc('#F3EBDB', 255), wobble=0.1, blur=0.1)
    c.wash([(653, 130), (675, 130), (676, 145), (652, 145)], hexc('#B3321F', 255), wobble=0.1, blur=0.1)
    c.ink(lh, width=1.2, closed=True)
    c.ink(win, width=6, closed=True, color=hexc('#2F5C99', 255))
    c.ink([(600, 40), (600, 220)], width=4, color=hexc('#2F5C99', 255))
    for sx in (440, 760):
        cur = [(sx - 30, 30), (sx + 30, 30), (sx + 20 * (1 if sx < 600 else -1), 240), (sx - 20, 240)]
        gingham(c, (sx - 30, 30, sx + 30, 236), 16)
    quimper(c, 180, 110, 56)
    quimper(c, 320, 150, 40)
    quimper(c, 960, 120, 50)
    # Casseroles en cuivre.
    for k, x in enumerate((1060, 1120, 1170)):
        c.ink([(x, 40), (x, 70)], width=1.4)
        pan = c.ellipse_pts(x, 96 + k * 6, 24 + k * 2, 24 + k * 2, 24)
        c.wash(pan, hexc('#C8702E', 255), wobble=0.3, blur=0.2)
        c.ink(pan, width=1.4, closed=True)
    # Plan de travail, nappe vichy, pâte, rouleau, beurre, carnet.
    top = [(-20, 440), (1220, 440), (1220, 640), (-20, 640)]
    c.wash(top, hexc('#A87A4E', 255), wobble=0.3, blur=0.2)
    c.hatch(top, spacing=8, angle=0, alpha=40)
    gingham(c, (140, 450, 760, 640), 28)
    dough = c.ellipse_pts(380, 540, 170, 60, 40)
    c.wash(dough, hexc('#F4E3C0', 255), wobble=0.8, blur=0.3)
    c.dots(40, (220, 490, 540, 590), hexc('#FFFFFF', 200), 1, 2.5)
    c.ink(dough, width=1.6, closed=True)
    c.ink([(250, 610), (560, 470)], width=18, color=hexc('#C8965A', 255))
    c.ink([(250, 610), (560, 470)], width=1.4)
    butter = [(620, 520), (720, 510), (730, 560), (628, 572)]
    c.wash(butter, hexc('#F6DE7A', 255), wobble=0.2, blur=0.1)
    c.ink(butter, width=1.4, closed=True)
    kouign(c, 960, 530, 110)
    book = [(800, 460), (900, 452), (906, 480), (806, 490)]
    c.wash(book, hexc('#6B3A2A', 255), wobble=0.2, blur=0.1)
    c.ink(book, width=1.4, closed=True)
    c.finish(f'{OUT}/cuisine-cuisine.png', vignette=0.25)


def marche():
    c = Canvas(W, H, seed=81)
    c.vgrad(hexc('#B8D4E0'), hexc('#F1E6CE'), 0, 360)
    c.cloud(300, 80, 320, 30, hexc('#FFFFFF', 210))
    c.cloud(900, 60, 260, 24, hexc('#FFFFFF', 190))
    # Halles et maisons en granit.
    for x, w, h in ((-20, 220, 260), (200, 180, 220), (820, 200, 240), (1020, 220, 280)):
        wall = [(x, 400), (x, 400 - h), (x + w, 400 - h), (x + w, 400)]
        c.wash(wall, hexc('#B8B0A4', 255), wobble=0.6, blur=0.3)
        c.hatch(wall, spacing=8, angle=0, alpha=40)
        roof = [(x - 6, 400 - h), (x + w / 2, 400 - h - 70), (x + w + 6, 400 - h)]
        c.wash(roof, hexc('#4A525C', 255), wobble=0.4, blur=0.2)
        c.ink(roof, width=1.6, closed=True)
        c.ink(wall[:3], width=1.6)
        for k in range(2):
            wx = x + w * (0.25 + 0.4 * k)
            win = [(wx, 400 - h + 40), (wx + 30, 400 - h + 40), (wx + 30, 400 - h + 90), (wx, 400 - h + 90)]
            c.wash(win, hexc('#2F5C99', 230), wobble=0.2, blur=0.1)
            c.ink(win, width=1.2, closed=True)
    # Sol pavé.
    c.vgrad(hexc('#A89A88'), hexc('#8A7C6C'), 400, 640)
    for y in range(410, 640, 24):
        off = (y // 24) % 2 * 20
        for x in range(-20 + off, 1220, 40):
            c.ink([(x, y), (x, y + 22)], width=0.8, color=INK + (60,))
        c.ink([(0, y), (1200, y)], width=0.8, color=INK + (60,))
    stall(c, 60, 320, 520, '#2F5C99', [('round', '#B3321F'), ('leaf', '#4A6B3A'), ('round', '#E8B04B')])
    stall(c, 440, 320, 540, '#B3321F', [('block', '#F6DE7A'), ('block', '#F3EBDB'), ('round', '#F4E3C0')])
    stall(c, 820, 320, 520, '#2E6030', [('round', '#C8403A'), ('round', '#9AB84A'), ('leaf', '#6B3A5A')])
    # Cagette de pommes au premier plan.
    crate = [(500, 640), (500, 580), (700, 580), (700, 640)]
    c.wash(crate, hexc('#C8965A', 255), wobble=0.3, blur=0.2)
    for y in (596, 616):
        c.ink([(500, y), (700, y)], width=1.2)
    c.ink(crate, width=1.8, closed=True)
    for k in range(7):
        ax = 516 + k * 28
        c.wash(c.ellipse_pts(ax, 574, 15, 14, 16), hexc('#C8403A' if k % 2 else '#9AB84A', 255), wobble=0.2, blur=0.1)
        c.ink(c.ellipse_pts(ax, 574, 15, 14, 16), width=1.1, closed=True)
    # Mouettes.
    for x, y in ((600, 90), (650, 120), (700, 80)):
        c.ink([(x - 14, y), (x - 5, y - 7), (x, y), (x + 5, y - 7), (x + 14, y)], width=2)
    c.finish(f'{OUT}/cuisine-marche.png', vignette=0.2)


def superette():
    c = Canvas(W, H, seed=82)
    c.vgrad(hexc('#EEF0E8'), hexc('#D8DCD0'), 0, H)
    c.vgrad(hexc('#B8B8AE'), hexc('#9A9A90'), 480, 640)
    for x in range(-20, 1220, 60):
        c.ink([(x, 480), (x - 80, 640)], width=0.8, color=INK + (60,))
    for y in (520, 570, 620):
        c.ink([(-20, y), (1220, y)], width=0.8, color=INK + (60,))
    # Néons.
    for x in (300, 900):
        c.glow(x, 30, 160, hexc('#FFFFFF', 120))
        c.wash([(x - 120, 20), (x + 120, 20), (x + 120, 34), (x - 120, 34)], hexc('#FFFFFF', 255), wobble=0.1, blur=0.2, edge=False)
    # Rayonnages.
    goods = ['#B3321F', '#E8B04B', '#2F5C99', '#2E6030', '#F3EBDB', '#C8702E', '#6B3A5A']
    for x0, x1 in ((40, 560), (640, 1160)):
        frame = [(x0, 480), (x0, 90), (x1, 90), (x1, 480)]
        c.wash(frame, hexc('#C8CED3', 255), wobble=0.3, blur=0.2)
        c.ink(frame, width=2, closed=True)
        for r in range(5):
            base = 160 + r * 76
            x = x0 + 10
            while x < x1 - 40:
                w = c.rng.uniform(24, 44)
                h = c.rng.uniform(34, 60)
                col = c.rng.choice(goods)
                if c.rng.random() < 0.3:
                    box = c.ellipse_pts(x + w / 2, base - h / 2, w / 2, h / 2, 16)
                else:
                    box = [(x, base), (x, base - h), (x + w, base - h), (x + w, base)]
                c.wash(box, hexc(col, 255), wobble=0.2, blur=0.1)
                c.ink(box, width=1, closed=True)
                x += w + 4
            c.wash([(x0, base), (x1, base), (x1, base + 10), (x0, base + 10)], hexc('#8A949C', 255), wobble=0.1, blur=0.1)
            c.wash([(x0 + 40, base + 2), (x0 + 70, base + 2), (x0 + 70, base + 10), (x0 + 40, base + 2 + 8)], hexc('#E8C870', 255), wobble=0.1, blur=0.1, edge=False)
    # Panneau « Promo » et panier.
    sign = [(520, 50), (680, 50), (680, 96), (520, 96)]
    c.wash(sign, hexc('#B3321F', 255), wobble=0.2, blur=0.1)
    c.ink(sign, width=1.6, closed=True)
    c.ink([(540, 73), (660, 73)], width=4, color=hexc('#F3EBDB', 255))
    c.ink([(600, 20), (600, 50)], width=1.2)
    basket = [(560, 620), (540, 540), (700, 540), (680, 620)]
    c.wash(basket, hexc('#B3321F', 240), wobble=0.3, blur=0.2)
    for k in range(6):
        c.ink([(548 + k * 26, 544), (566 + k * 20, 616)], width=1.2)
    c.ink(basket, width=1.8, closed=True)
    c.ink(c.ellipse_pts(620, 540, 60, 50, 24, math.pi, 2 * math.pi), width=4)
    c.finish(f'{OUT}/cuisine-superette.png', vignette=0.2)


def salle():
    c = Canvas(W, H, seed=83)
    c.vgrad(hexc('#E8DCC4'), hexc('#D8C8A8'), 0, H)
    # Lambris, fenêtres hautes, banderole.
    c.wash([(-20, 360), (1220, 360), (1220, 470), (-20, 470)], hexc('#A87A4E', 255), wobble=0.3, blur=0.2)
    for x in range(0, 1200, 60):
        c.ink([(x, 360), (x, 470)], width=1, color=INK + (90,))
    for x in (80, 360, 760, 1040):
        win = c.ellipse_pts(x + 40, 110, 40, 40, 20, math.pi, 2 * math.pi) + [(x + 80, 220), (x, 220)]
        c.vgrad(hexc('#B8D4E0'), hexc('#E8EEF0'), 70, 220, mask=c.mask_poly(win))
        c.ink(win, width=3, closed=True, color=hexc('#5E3A1E', 255))
    ban = [(360, 40), (840, 40), (820, 60), (840, 90), (360, 90), (380, 60)]
    c.wash(ban, hexc('#2F5C99', 255), wobble=0.3, blur=0.2)
    c.ink(ban, width=1.6, closed=True)
    c.ink([(420, 64), (780, 64)], width=5, color=hexc('#F3EBDB', 255))
    string_lights(c, -20, 1220, 120, 50, 14)
    # Table du jury, nappe blanche, trois assiettes numérotées.
    table = [(80, 640), (120, 470), (1080, 470), (1120, 640)]
    c.wash(table, hexc('#F7F2E8', 255), wobble=0.3, blur=0.2)
    for x in range(140, 1080, 60):
        c.ink([(x, 480), (x - 10 + (x - 600) * 0.05, 640)], width=0.8, color=hexc('#C8BCA8', 200))
    c.ink(table, width=2, closed=True)
    for k, x in enumerate((300, 600, 900)):
        plate = c.ellipse_pts(x, 540, 110, 40, 40)
        c.wash(plate, hexc('#FBF6EC', 255), wobble=0.2, blur=0.1)
        c.ink(plate, width=1.6, closed=True)
        c.ink(c.ellipse_pts(x, 540, 96, 33, 40), width=1.6, closed=True, color=hexc('#2F5C99', 255))
        kouign(c, x, 528, 66)
        card = [(x - 20, 600), (x + 20, 600), (x + 20, 624), (x - 20, 624)]
        c.wash(card, hexc('#F3EBDB', 255), wobble=0.1, blur=0.1)
        c.ink(card, width=1.2, closed=True)
        for d in range(k + 1):
            c.ink([(x - 6 + d * 6, 606), (x - 6 + d * 6, 618)], width=2)
    # Coupe dorée.
    cx = 600
    cup = [(cx - 40, 400), (cx + 40, 400), (cx + 20, 450), (cx - 20, 450)]
    c.glow(cx, 420, 60, hexc('#FFE08A', 150))
    c.wash(cup, hexc('#D8B040', 255), wobble=0.2, blur=0.1)
    c.ink(cup, width=1.6, closed=True)
    c.ink([(cx, 450), (cx, 470)], width=6, color=hexc('#D8B040', 255))
    c.ink([(cx - 20, 472), (cx + 20, 472)], width=5, color=hexc('#B08A30', 255))
    c.finish(f'{OUT}/cuisine-salle.png', vignette=0.22)


if __name__ == '__main__':
    only = sys.argv[2:] or ['cuisine', 'marche', 'superette', 'salle']
    for name in only:
        globals()[name]()
