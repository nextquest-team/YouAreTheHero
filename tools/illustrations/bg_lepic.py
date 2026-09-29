import math
import sys

from kit import INK, Canvas, hexc
from lepic import lamp, sacre_coeur

OUT = sys.argv[1] if len(sys.argv) > 1 else 'out'
W, H = 1200, 640
SPINES = ['#8C2F22', '#2F4E6E', '#4A6B3A', '#C49A3A', '#6B3A5A', '#D8C8A8', '#3A3430', '#A8583A']


def shelf(c, x0, x1, y_top, rows, row_h=86):
    frame = [(x0 - 10, y_top - 10), (x1 + 10, y_top - 10), (x1 + 10, y_top + rows * row_h + 10), (x0 - 10, y_top + rows * row_h + 10)]
    c.wash(frame, hexc('#5E3A1E', 255), wobble=0.4, blur=0.2)
    c.ink(frame, width=2, closed=True)
    for r in range(rows):
        base = y_top + (r + 1) * row_h
        x = x0
        while x < x1 - 10:
            w = c.rng.uniform(10, 22)
            h = c.rng.uniform(row_h * 0.6, row_h * 0.9)
            lean = c.rng.random() < 0.08
            col = c.rng.choice(SPINES)
            book = [(x, base), (x, base - h), (x + w, base - h), (x + w, base)]
            if lean:
                book = [(x, base), (x + 14, base - h), (x + 14 + w, base - h + 4), (x + w, base)]
            c.wash(book, hexc(col, 255), wobble=0.2, blur=0.1)
            c.ink(book, width=1.1, closed=True)
            c.ink([(x + 3, base - h * 0.75), (x + w - 3, base - h * 0.75)], width=1, color=hexc('#E8C870', 200))
            x += w + (16 if lean else 1)
        c.wash([(x0 - 10, base), (x1 + 10, base), (x1 + 10, base + 8), (x0 - 10, base + 8)], hexc('#7A4A26', 255), wobble=0.2, blur=0.1)
        c.ink([(x0 - 10, base), (x1 + 10, base)], width=1.6)


def string_lights(c, x0, x1, y, sag, n):
    pts = [(x0 + (x1 - x0) * t, y + sag * 4 * t * (1 - t)) for t in [i / 30 for i in range(31)]]
    c.ink(pts, width=1.4)
    for k in range(1, n):
        t = k / n
        bx, by = x0 + (x1 - x0) * t, y + sag * 4 * t * (1 - t)
        c.glow(bx, by + 8, 30, hexc('#FFD27A', 140))
        c.wash(c.ellipse_pts(bx, by + 8, 5, 7, 12), hexc('#FFF0B8', 255), wobble=0, blur=0.2, edge=False)


def couple(c, x, base, s=1.0, col1='#2F4E6E', col2='#8C2F22'):
    """Deux silhouettes qui dansent, vues en ombre, sans détail genré."""
    for dx, col, tilt in ((-18, col1, 6), (18, col2, -6)):
        cx = x + dx * s
        body = [(cx - 16 * s, base), (cx - 20 * s + tilt, base - 90 * s), (cx - 14 * s + tilt, base - 130 * s), (cx + 14 * s + tilt, base - 130 * s), (cx + 20 * s + tilt, base - 90 * s), (cx + 16 * s, base)]
        c.wash(body, hexc(col, 235), wobble=0.4, blur=0.2)
        c.ink(body, width=1.4, closed=True)
        head = c.ellipse_pts(cx + tilt, base - 146 * s, 13 * s, 15 * s, 20)
        c.wash(head, hexc('#3A3430', 235), wobble=0.2, blur=0.1)
        c.ink(head, width=1.4, closed=True)
    c.ink([(x - 10 * s, base - 110 * s), (x + 10 * s, base - 112 * s)], width=4 * s, color=hexc('#3A3430', 235))


def librairie():
    c = Canvas(W, H, seed=50)
    c.vgrad(hexc('#E9D9B8'), hexc('#D9C39A'), 0, H)
    shelf(c, 40, 380, 60, 5)
    shelf(c, 820, 1160, 60, 5)
    # Vitrine au centre : la rue Lepic au soir.
    win = [(440, 60), (760, 60), (760, 470), (440, 470)]
    c.vgrad(hexc('#F2C08C'), hexc('#8B7E9C'), 60, 470, mask=c.mask_poly(win))
    c.wash([(440, 330), (520, 250), (560, 280), (640, 220), (700, 260), (760, 240), (760, 470), (440, 470)], hexc('#6C6478', 220), wobble=0.6, blur=0.3)
    lamp(c, 690, 470, h=210)
    for wx in (460, 520, 600):
        c.wash([(wx, 320), (wx + 18, 320), (wx + 18, 344), (wx, 344)], hexc('#FFD98A', 240), wobble=0.2, blur=0.1, edge=False)
    c.ink(win, width=4, closed=True, color=hexc('#5E3A1E', 255))
    c.ink([(600, 60), (600, 470)], width=4, color=hexc('#5E3A1E', 255))
    c.ink([(440, 260), (760, 260)], width=4, color=hexc('#5E3A1E', 255))
    # Lettrage à l'envers sur la vitre.
    c.ink([(470, 100), (570, 100)], width=3, color=hexc('#E8C870', 200))
    c.ink([(630, 100), (730, 100)], width=3, color=hexc('#E8C870', 200))
    # Comptoir, piles de livres, lampe verte, chat.
    counter = [(360, 640), (380, 500), (840, 500), (860, 640)]
    c.wash(counter, hexc('#7A4A26', 255), wobble=0.4, blur=0.2)
    c.hatch(counter, spacing=6, angle=0, alpha=60)
    c.ink(counter, width=2, closed=True)
    c.wash([(370, 490), (850, 490), (850, 504), (370, 504)], hexc('#5E3A1E', 255), wobble=0.2, blur=0.1)
    for bx, n in ((420, 5), (500, 3), (760, 4)):
        for k in range(n):
            w = 90 - k * 4
            b = [(bx - w / 2, 490 - k * 16), (bx + w / 2, 490 - k * 16), (bx + w / 2 - 2, 476 - k * 16), (bx - w / 2 + 2, 476 - k * 16)]
            c.wash(b, hexc(SPINES[(k * 3 + n) % len(SPINES)], 255), wobble=0.2, blur=0.1)
            c.ink(b, width=1.2, closed=True)
    c.glow(640, 420, 110, hexc('#FFE6A6', 150))
    c.ink([(640, 490), (640, 420)], width=3, color=hexc('#C9A040', 255))
    shade = [(606, 430), (620, 400), (660, 400), (674, 430)]
    c.wash(shade, hexc('#2E6030', 255), wobble=0.2, blur=0.1)
    c.ink(shade, width=1.6, closed=True)
    cat = c.ellipse_pts(560, 470, 40, 20, 30)
    c.wash(cat, hexc('#3A3430', 255), wobble=0.3, blur=0.2)
    c.wash([(588, 470), (598, 438), (606, 452), (614, 436), (620, 468)], hexc('#3A3430', 255), wobble=0.2, blur=0.1)
    c.ink([(520, 478), (500, 486), (496, 470)], width=4, color=hexc('#3A3430', 255))
    c.finish(f'{OUT}/lepic-librairie.png', vignette=0.3)


def mansarde():
    c = Canvas(W, H, seed=51)
    c.vgrad(hexc('#EFE2C8'), hexc('#DCC9A6'), 0, H)
    # Plafond en pente et poutres.
    slope = [(-20, -20), (700, -20), (-20, 330)]
    c.wash(slope, hexc('#D2BD96', 255), wobble=0.4, blur=0.3)
    for k in range(1, 5):
        c.ink([(700 - k * 150, -20), (-20, 330 - k * 73)], width=10, color=hexc('#7A4A26', 255))
    c.ink([(700, -20), (-20, 330)], width=12, color=hexc('#5E3A1E', 255))
    # Lucarne : toits de Paris et Sacré-Cœur au loin.
    sky = [(760, 70), (1080, 70), (1080, 350), (760, 350)]
    c.vgrad(hexc('#F7D6A2'), hexc('#B8C8D8'), 70, 350, mask=c.mask_poly(sky))
    c.wash([(760, 300), (800, 280), (860, 290), (900, 262), (960, 276), (1080, 258), (1080, 350), (760, 350)], hexc('#8A8FA0', 230), wobble=0.5, blur=0.3)
    for x in (790, 850, 930, 1010):
        c.wash([(x, 290), (x + 10, 290), (x + 10, 268), (x, 268)], hexc('#B5523A', 240), wobble=0.2, blur=0.1)
    sacre_coeur(c, 940, 250, s=0.45)
    c.ink(sky, width=6, closed=True, color=hexc('#5E3A1E', 255))
    c.ink([(920, 70), (920, 350)], width=4, color=hexc('#5E3A1E', 255))
    c.ink([(760, 210), (1080, 210)], width=4, color=hexc('#5E3A1E', 255))
    # Rai de lumière au sol.
    c.wash([(760, 350), (1080, 350), (980, 640), (560, 640)], hexc('#FFF1C4', 60), wobble=0, blur=10, edge=False)
    # Plancher.
    floor = [(-20, 640), (-20, 520), (1220, 520), (1220, 640)]
    c.wash(floor, hexc('#A87A4E', 255), wobble=0.4, blur=0.2)
    for k in range(-10, 20):
        c.ink([(600 + k * 50, 520), (600 + k * 120, 640)], width=1, color=INK + (90,))
    # Chevalet et toile.
    c.ink([(250, 560), (310, 200)], width=5, color=hexc('#8A5A32', 255))
    c.ink([(370, 560), (310, 200)], width=5, color=hexc('#8A5A32', 255))
    c.ink([(310, 560), (310, 250)], width=4, color=hexc('#8A5A32', 255))
    canvas = [(220, 220), (400, 220), (400, 440), (220, 440)]
    c.wash(canvas, hexc('#F7F0E0', 255), wobble=0.3, blur=0.2)
    c.wash([(240, 400), (270, 330), (300, 360), (340, 290), (380, 400)], hexc('#6B8FB0', 230), wobble=1, blur=0.5, edge=False)
    c.wash(c.ellipse_pts(340, 270, 18, 18), hexc('#E8B04B', 240), wobble=0.4, blur=0.4, edge=False)
    c.ink(canvas, width=2, closed=True)
    c.ink([(210, 444), (410, 444)], width=5, color=hexc('#8A5A32', 255))
    # Bureau, lettres et tiroir.
    desk = [(560, 520), (560, 420), (820, 420), (820, 520)]
    c.wash(desk, hexc('#7A4A26', 255), wobble=0.3, blur=0.2)
    c.ink(desk, width=2, closed=True)
    drawer = [(600, 440), (780, 440), (780, 480), (600, 480)]
    c.wash(drawer, hexc('#8A5A32', 255), wobble=0.2, blur=0.1)
    c.ink(drawer, width=1.4, closed=True)
    c.wash(c.ellipse_pts(690, 460, 6, 6, 12), hexc('#C9A040', 255), wobble=0, blur=0)
    for k, (lx, ly, a) in enumerate([(610, 404, -6), (660, 400, 4), (720, 406, -2)]):
        env = [(lx, ly), (lx + 70, ly + a * 0.3), (lx + 70, ly + 20), (lx, ly + 20)]
        c.wash(env, hexc('#F7EEDD', 255), wobble=0.2, blur=0.1)
        c.ink(env, width=1.2, closed=True)
        c.ink([(lx, ly), (lx + 35, ly + 12), (lx + 70, ly + a * 0.3)], width=1)
    c.wash(c.ellipse_pts(700, 420, 6, 6, 12), hexc('#B3321F', 255), wobble=0, blur=0)
    # Pots de pinceaux.
    jar = [(460, 520), (464, 470), (506, 470), (510, 520)]
    c.wash(jar, hexc('#9CB7C9', 220), wobble=0.2, blur=0.1)
    c.ink(jar, width=1.4, closed=True)
    for dx, h in ((-10, 60), (0, 74), (12, 64)):
        c.ink([(485 + dx, 472), (485 + dx * 1.6, 472 - h)], width=2.4, color=hexc('#8A5A32', 255))
    c.finish(f'{OUT}/lepic-mansarde.png', vignette=0.3)


def bal():
    c = Canvas(W, H, seed=52)
    c.vgrad(hexc('#1E2340'), hexc('#4A3A5A'), 0, 460)
    c.dots(80, (0, 0, 1200, 260), hexc('#F3EBDB', 200), 0.5, 1.5)
    # Arbres de la place en ombre.
    for x, r in ((80, 170), (1120, 190), (320, 120), (900, 130)):
        blob = [(x + r * math.cos(t) * (1 + 0.12 * math.sin(7 * t)), 230 + r * 0.7 * math.sin(t)) for t in [i / 40 * 2 * math.pi for i in range(41)]]
        c.wash(blob, hexc('#1A2A2A', 240), wobble=2, blur=0.5)
    for y, sag in ((50, 80), (130, 50)):
        string_lights(c, -20, 1220, y, sag, 12)
    # Kiosque à musique.
    c.glow(600, 330, 260, hexc('#FFC46A', 110))
    roof = [(460, 260), (600, 180), (740, 260)]
    c.wash(roof, hexc('#8C2F22', 255), wobble=0.4, blur=0.2)
    c.ink(roof, width=2, closed=True)
    for x in (480, 560, 640, 720):
        c.ink([(x, 262), (x, 400)], width=4, color=hexc('#F3EBDB', 255))
    c.wash([(450, 400), (750, 400), (740, 430), (460, 430)], hexc('#F3EBDB', 255), wobble=0.3, blur=0.2)
    c.ink([(450, 400), (750, 400), (740, 430), (460, 430)], width=1.6, closed=True)
    # Accordéon sur le kiosque.
    acc = [(580, 390), (580, 340), (620, 340), (620, 390)]
    c.wash(acc, hexc('#B3321F', 255), wobble=0.2, blur=0.1)
    for k in range(6):
        c.ink([(580, 346 + k * 8), (620, 346 + k * 8)], width=1)
    c.ink(acc, width=1.4, closed=True)
    # Pavés.
    c.vgrad(hexc('#6C5A50'), hexc('#3A302A'), 440, 640)
    for y in range(450, 640, 22):
        off = (y // 22) % 2 * 20
        for x in range(-20 + off, 1220, 40):
            c.ink([(x, y), (x, y + 20)], width=0.8, color=INK + (70,))
        c.ink([(0, y), (1200, y)], width=0.8, color=INK + (70,))
    c.wash(c.ellipse_pts(600, 540, 420, 60, 40), hexc('#FFC46A', 50), wobble=0, blur=10, edge=False)
    couple(c, 380, 600, 1.1)
    couple(c, 820, 590, 1.0, col1='#4A6B3A', col2='#C49A3A')
    couple(c, 600, 520, 0.7, col1='#6B3A5A', col2='#2F4E6E')
    c.finish(f'{OUT}/lepic-bal.png', vignette=0.3)


def theatre():
    c = Canvas(W, H, seed=53)
    c.vgrad(hexc('#2A1A1A'), hexc('#140C0C'), 0, H)
    c.glow(600, 360, 320, hexc('#FFD98A', 140))
    # Scène.
    stage = [(200, 470), (1000, 470), (1100, 560), (100, 560)]
    c.wash(stage, hexc('#8A5A32', 255), wobble=0.4, blur=0.2)
    for k in range(12):
        x = 200 + k * 800 / 11
        c.ink([(x, 470), (100 + k * 1000 / 11, 560)], width=1, color=INK + (90,))
    c.ink(stage, width=2, closed=True)
    # Décor peint : toits de Paris.
    back = [(220, 140), (980, 140), (980, 470), (220, 470)]
    c.vgrad(hexc('#3A4A6E'), hexc('#8B7E9C'), 140, 470, mask=c.mask_poly(back))
    c.wash(c.ellipse_pts(800, 220, 34, 34), hexc('#F7EBC0', 255), wobble=0.3, blur=0.3, edge=False)
    roofs = [(220, 470), (220, 360), (300, 330), (360, 360), (420, 310), (520, 340), (600, 300), (700, 350), (780, 320), (880, 350), (980, 330), (980, 470)]
    c.wash(roofs, hexc('#2A2A40', 240), wobble=1, blur=0.3)
    # Rideaux rouges et lambrequin.
    for side in (-1, 1):
        edge = 220 if side < 0 else 980
        outer = -20 if side < 0 else 1220
        cur = [(outer, -20), (edge + side * -60, -20), (edge + side * 10, 280), (edge + side * -20, 560), (outer, 560)]
        c.wash(cur, hexc('#8C1F1A', 255), wobble=0.6, blur=0.3)
        for k in range(8):
            fx = outer + (edge - outer) * k / 8
            c.ink([(fx, 0), (fx + side * -10 + (edge - fx) * 0.15, 560)], width=2, color=hexc('#5A1210', 200))
        c.ink(cur, width=2, closed=True)
        c.ink([(edge + side * 20, 290), (outer, 300)], width=6, color=hexc('#D8B040', 255))
    val = [(-20, -20), (1220, -20), (1220, 70)] + [(1220 - k * 60, 70 + (18 if k % 2 else 0)) for k in range(1, 21)] + [(-20, 70)]
    c.wash(val, hexc('#7A1A16', 255), wobble=0.4, blur=0.2)
    c.ink([(-20, 60), (1220, 60)], width=4, color=hexc('#D8B040', 255))
    # Rangée de fauteuils vue de dos.
    for k in range(13):
        x = -20 + k * 100
        seat = c.ellipse_pts(x, 640, 46, 70, 30, math.pi, 2 * math.pi)
        c.wash(seat, hexc('#5A1210', 255), wobble=0.3, blur=0.2)
        c.ink(seat, width=1.6)
    c.dots(40, (200, 100, 1000, 470), hexc('#FFE6A6', 120), 1, 2.5)
    c.finish(f'{OUT}/lepic-theatre.png', vignette=0.35)


def gare():
    c = Canvas(W, H, seed=54)
    c.vgrad(hexc('#D8D2C0'), hexc('#B8B2A2'), 0, H)
    # Verrière.
    for k in range(-6, 7):
        c.ink([(600 + k * 30, 250), (600 + k * 170, -20)], width=3, color=hexc('#4A4A52', 255))
    for y in (40, 110, 180, 230):
        t = (250 - y) / 270
        c.ink([(600 - 1100 * t, y), (600 + 1100 * t, y)], width=2, color=hexc('#4A4A52', 200))
    c.glow(600, 60, 400, hexc('#FFFFFF', 90))
    # Horloge.
    c.ink([(600, -10), (600, 150)], width=3)
    clock = c.ellipse_pts(600, 190, 44, 44, 40)
    c.wash(clock, hexc('#FBF6EC', 255), wobble=0.2, blur=0.1)
    c.ink(clock, width=3, closed=True)
    for k in range(12):
        a = k * math.pi / 6
        c.ink([(600 + 36 * math.cos(a), 190 + 36 * math.sin(a)), (600 + 42 * math.cos(a), 190 + 42 * math.sin(a))], width=1.6)
    c.ink([(600, 190), (600, 160)], width=2.4)
    c.ink([(600, 190), (624, 196)], width=2.4)
    # Quais et train.
    c.vgrad(hexc('#8A8478'), hexc('#5E5850'), 330, 640)
    train = [(640, 470), (660, 300), (1220, 250), (1220, 520)]
    c.wash(train, hexc('#2F4E6E', 255), wobble=0.4, blur=0.2)
    c.wash([(650, 380), (1220, 350), (1220, 372), (646, 402)], hexc('#E8C870', 255), wobble=0.2, blur=0.1)
    for k in range(6):
        x0 = 690 + k * 90
        y0 = 310 - k * 8
        win = [(x0, y0 + 6), (x0 + 60, y0), (x0 + 60, y0 + 50), (x0, y0 + 56)]
        c.wash(win, hexc('#FFE6A6', 240), wobble=0.2, blur=0.1)
        c.ink(win, width=1.4, closed=True)
    c.ink(train, width=2, closed=True)
    platform = [(-20, 640), (-20, 460), (640, 460), (560, 640)]
    c.wash(platform, hexc('#C8BFA8', 255), wobble=0.4, blur=0.2)
    c.ink([(640, 460), (560, 640)], width=3, color=hexc('#E8C870', 255))
    for y in range(480, 640, 30):
        c.ink([(-20, y), (620 - (y - 460) * 0.44, y)], width=0.8, color=INK + (60,))
    # Valise et silhouette de dos.
    case = [(300, 590), (300, 520), (400, 520), (400, 590)]
    c.wash(case, hexc('#8A4A26', 255), wobble=0.3, blur=0.2)
    c.ink(case, width=2, closed=True)
    c.ink([(335, 520), (340, 504), (360, 504), (365, 520)], width=2.4)
    fx, fb = 460, 600
    coat = [(fx - 34, fb - 10), (fx - 30, fb - 150), (fx - 18, fb - 170), (fx + 18, fb - 170), (fx + 30, fb - 150), (fx + 34, fb - 10)]
    c.wash(coat, hexc('#4A3A30', 255), wobble=0.4, blur=0.2)
    c.hatch(coat, spacing=5, angle=80, alpha=80)
    c.ink(coat, width=2, closed=True)
    head = c.ellipse_pts(fx, fb - 190, 18, 21, 24)
    c.wash(head, hexc('#3A2A22', 255), wobble=0.2, blur=0.1)
    c.ink(head, width=1.8, closed=True)
    c.ink([(fx - 26, fb - 172), (fx + 26, fb - 172)], width=6, color=hexc('#B3321F', 255))
    # Vapeur.
    for k in range(5):
        c.cloud(900 - k * 70, 230 - k * 30, 200, 36, hexc('#FFFFFF', 150), soft=6)
    c.finish(f'{OUT}/lepic-gare.png', vignette=0.25)


def escaliers():
    c = Canvas(W, H, seed=55)
    c.vgrad(hexc('#F7C9A2'), hexc('#F4E0BE'), 0, 330)
    c.glow(900, 300, 280, hexc('#FFE2A6', 200))
    c.wash(c.ellipse_pts(900, 300, 46, 46), hexc('#FCE9BA', 255), wobble=0.3, blur=0.6, edge=False)
    c.cloud(300, 100, 320, 28, hexc('#F9DCC0', 200))
    # Paris à l'aube, dans la brume.
    for row, (y0, col, a) in enumerate([(300, '#C8B8C0', 180), (330, '#A89AA8', 210)]):
        x = -20
        while x < 1220:
            w = c.rng.uniform(30, 70)
            h = c.rng.uniform(20, 60)
            c.wash([(x, y0 + 60), (x, y0 - h), (x + w, y0 - h), (x + w, y0 + 60)], hexc(col, a), wobble=0.4, blur=0.4, edge=False)
            x += w
    ex = 420
    c.wash([(ex - 40, 330), (ex, 170), (ex + 40, 330)], hexc('#8B7E9C', 220), wobble=0.3, blur=0.4, edge=False)
    c.ink([(ex - 40, 330), (ex, 170), (ex + 40, 330)], width=1.2, color=hexc('#6C6478', 220))
    c.ink([(ex - 26, 280), (ex + 26, 280)], width=1.2, color=hexc('#6C6478', 220))
    # Escaliers qui descendent vers le spectateur.
    for k in range(14):
        t = k / 13
        y = 360 + 280 * t ** 1.3
        half = 140 + 360 * t
        step = [(600 - half, y), (600 + half, y), (600 + half, y + 14 + 16 * t), (600 - half, y + 14 + 16 * t)]
        c.wash(step, hexc('#D8CCB8' if k % 2 else '#CDBFA8', 255), wobble=0.3, blur=0.2)
        c.ink([(600 - half, y), (600 + half, y)], width=1.4)
    # Rampes centrales et murets.
    c.ink([(600, 360), (600, 660)], width=4, color=hexc('#2A2622', 255))
    for s_ in (-1, 1):
        wall = [(600 + s_ * 140, 360), (600 + s_ * 1220, 640), (600 + s_ * 1220, 330), (600 + s_ * 150, 330)]
        c.wash(wall, hexc('#B5A58E', 255), wobble=0.4, blur=0.2)
        c.hatch(wall, spacing=7, angle=0, alpha=60)
        c.ink(wall[:2], width=2)
    lamp(c, 340, 470, h=250, lit=False)
    lamp(c, 860, 470, h=250, lit=False)
    # Arbres.
    for x in (80, 1120):
        blob = [(x + 150 * math.cos(t) * (1 + 0.12 * math.sin(7 * t)), 160 + 110 * math.sin(t)) for t in [i / 40 * 2 * math.pi for i in range(41)]]
        c.wash(blob, hexc('#6B8A4E', 235), wobble=2, blur=0.5)
        c.hatch(blob, spacing=6, angle=60, alpha=70)
    c.finish(f'{OUT}/lepic-escaliers.png', vignette=0.2)


if __name__ == '__main__':
    only = sys.argv[2:] or ['librairie', 'mansarde', 'bal', 'theatre', 'gare', 'escaliers']
    for name in only:
        globals()[name]()
