import math
import sys

from borealis import aurora, curve, module
from kit import INK, Canvas, hexc

OUT = sys.argv[1] if len(sys.argv) > 1 else 'out'
W, H = 1200, 640


def corridor(c, wall='#C8CED3', floor='#6E7680', light='#E8F0F4', vx=600, vy=300):
    """Couloir en perspective avec point de fuite (vx, vy)."""
    c.vgrad(hexc('#2A3038'), hexc('#1A1E24'), 0, H)
    back = [(vx - 110, vy - 90), (vx + 110, vy - 90), (vx + 110, vy + 90), (vx - 110, vy + 90)]
    c.wash([(-20, -20), (1220, -20), back[1], back[0]], hexc('#9AA2AA', 255), wobble=0.3, blur=0.2)
    c.wash([(-20, 660), (1220, 660), back[2], back[3]], hexc(floor, 255), wobble=0.3, blur=0.2)
    c.wash([(-20, -20), back[0], back[3], (-20, 660)], hexc(wall, 255), wobble=0.3, blur=0.2)
    c.wash([(1220, -20), back[1], back[2], (1220, 660)], hexc(wall, 240), wobble=0.3, blur=0.2)
    c.hatch([(1220, -20), back[1], back[2], (1220, 660)], spacing=6, angle=80, alpha=50)
    for p in back:
        c.ink([p, (vx + (p[0] - vx) * 8, vy + (p[1] - vy) * 8)], width=1.6)
    c.wash(back, hexc('#3A4048', 255), wobble=0.2, blur=0.2)
    c.ink(back, width=1.6, closed=True)
    # Néons au plafond et joints de panneaux.
    for k in range(1, 5):
        t = 1 - k / 5
        s = 1 + t * 7
        x0, x1 = vx - 40 * s, vx + 40 * s
        y = vy - 90 * s
        c.glow(vx, y + 8, 60 * s ** 0.8, hexc(light, 90))
        c.wash([(x0, y), (x1, y), (x1 - 4, y + 3 * s), (x0 + 4, y + 3 * s)], hexc('#FFFFFF', 255), wobble=0.1, blur=0.2, edge=False)
        for side in (-1, 1):
            x = vx + side * 110 * s
            c.ink([(x, vy - 90 * s), (x, vy + 90 * s)], width=1.2, color=INK + (110,))
        c.ink([(vx - 110 * s, vy + 90 * s), (vx + 110 * s, vy + 90 * s)], width=1, color=INK + (90,))
    return back


def door(c, pts, color='#8A949C', lit=None):
    c.wash(pts, hexc(color, 255), wobble=0.2, blur=0.1)
    c.ink(pts, width=1.8, closed=True)
    if lit:
        cx = sum(p[0] for p in pts) / 4
        cy = min(p[1] for p in pts) + 20
        c.glow(cx, cy, 20, hexc(lit, 200))
        c.wash(c.ellipse_pts(cx, cy, 5, 5, 12), hexc(lit, 255), wobble=0, blur=0.1, edge=False)


def exterieur():
    c = Canvas(W, H, seed=70)
    c.vgrad(hexc('#0B1222'), hexc('#1C3044'), 0, 460)
    c.dots(220, (0, 0, 1200, 380), hexc('#F3EBDB', 210), 0.5, 1.6)
    aurora(c, curve(-20, 1220, 220, 50, 160, 1.3), 180, hexc('#A184E6'), alpha=110)
    aurora(c, curve(-20, 1220, 320, 50, 130, 0.2), 240, hexc('#62DDA2'), alpha=160)
    far = [(-20, 460)] + [(x, 400 - 30 * abs(math.sin(x / 120 + 0.4)) - 16 * math.sin(x / 37) ** 2) for x in range(-20, 1230, 18)] + [(1220, 460)]
    c.wash(far, hexc('#2E4760', 252), wobble=1, blur=0.4)
    c.ink(far[1:-1], width=1.4, color=INK + (160,))
    c.vgrad(hexc('#D3E3EC'), hexc('#8EA8BD'), 440, 640)
    for k in range(6):
        c.ink(curve(-20, 1220, 470 + k * 30 + k * k * 2, 5, 90 + k * 14, k, 12), width=1.1, color=hexc('#5E7F99', 110))
    module(c, 330, 380, 300, 100, [0.2, 0.4, 0.6, 0.8])
    module(c, 650, 400, 180, 80, [0.3, 0.7], color='#C8CED3')
    c.wash([(630, 420), (652, 420), (652, 444), (630, 444)], hexc('#9BA3AA', 255), wobble=0.2, blur=0.1)
    c.ink([(420, 380), (420, 230)], width=3)
    for k in range(5):
        y = 380 - k * 30
        c.ink([(411, y), (429, y - 15)], width=1.2)
        c.ink([(429, y), (411, y - 15)], width=1.2)
    c.glow(420, 226, 24, hexc('#FF5A3C', 210))
    c.wash(c.ellipse_pts(600, 520, 330, 14, 40), hexc('#5E7F99', 110), wobble=0.5, blur=4, edge=False)
    # Motoneige.
    sx, sy = 960, 560
    body = [(sx - 80, sy), (sx - 60, sy - 40), (sx + 50, sy - 44), (sx + 80, sy - 20), (sx + 70, sy)]
    c.wash(body, hexc('#B3321F', 255), wobble=0.3, blur=0.2)
    c.ink(body, width=2, closed=True)
    c.ink([(sx - 100, sy + 14), (sx + 100, sy + 14), (sx + 120, sy)], width=4)
    c.ink([(sx + 40, sy - 44), (sx + 30, sy - 70), (sx + 60, sy - 74)], width=3)
    c.dots(120, (0, 200, 1200, 640), hexc('#FFFFFF', 200), 0.8, 2.2)
    c.finish(f'{OUT}/borealis-exterieur.png', vignette=0.3)


def couloir(name='couloir', spores=False):
    c = Canvas(W, H, seed=71)
    back = corridor(c)
    door(c, [(80, 120), (220, 150), (220, 560), (80, 620)], lit='#62DDA2')
    door(c, [(1120, 120), (980, 150), (980, 560), (1120, 620)], lit='#B3321F' if spores else '#62DDA2')
    # Panneau de signalisation au mur.
    sign = [(300, 200), (400, 214), (400, 256), (300, 250)]
    c.wash(sign, hexc('#E8C870', 255), wobble=0.1, blur=0.1)
    c.ink(sign, width=1.4, closed=True)
    c.ink([(316, 230), (380, 238)], width=3)
    c.ink([(370, 228), (384, 238), (368, 246)], width=3)
    # Câbles et tuyaux le long du plafond.
    for k, col in enumerate(('#B3321F', '#2F4E6E', '#E8C870')):
        c.ink([(-20, 40 + k * 10), (back[0][0], back[0][1] + 6 + k * 3)], width=4 - k, color=hexc(col, 255))
    if spores:
        c.glow(600, 330, 460, hexc('#E8C050', 150))
        for k in range(10):
            c.cloud(c.rng.uniform(100, 1100), c.rng.uniform(300, 600), c.rng.uniform(200, 380), c.rng.uniform(30, 60), hexc('#E8C870', 90), soft=10)
        c.dots(320, (0, 0, 1200, 640), hexc('#FFE6A0', 220), 1, 3)
        c.dots(80, (0, 0, 1200, 640), hexc('#FFF6C8', 255), 2, 4.5)
        # Une traînée de spores sur le mur.
        for k in range(30):
            x, y = c.rng.uniform(240, 420), c.rng.uniform(300, 540)
            c.wash(c.ellipse_pts(x, y, c.rng.uniform(4, 12), c.rng.uniform(4, 10), 12), hexc('#C8A030', 160), wobble=0.6, blur=1, edge=False)
    else:
        # Traces de pas humides.
        for k in range(8):
            t = k / 7
            x = 600 + (1 - t) * 60 * (1 if k % 2 else -1) * 0.5
            y = 620 - 220 * t
            c.wash(c.ellipse_pts(x, y, 14 - 8 * t, 6 - 3 * t, 12), hexc('#4A525C', 200), wobble=0.2, blur=0.4, edge=False)
    c.finish(f'{OUT}/borealis-{name}.png', vignette=0.3)


def spores():
    couloir('spores', spores=True)


def radio():
    c = Canvas(W, H, seed=72)
    c.vgrad(hexc('#1E242C'), hexc('#12161C'), 0, H)
    # Hublot : aurore dehors.
    port = c.ellipse_pts(950, 200, 120, 120, 50)
    c.vgrad(hexc('#0B1222'), hexc('#1C3044'), 80, 320, mask=c.mask_poly(port))
    c.dots(30, (880, 110, 1020, 180), hexc('#F3EBDB', 220), 0.6, 1.6)
    c.wash([(836, 240), (900, 200), (980, 230), (1064, 190), (1064, 250), (980, 280), (900, 260), (836, 290)], hexc('#62DDA2', 120), wobble=1, blur=6, edge=False)
    arc = [(950 + 118 * math.cos(a), 200 + 118 * math.sin(a)) for a in [math.pi * (0.2 + 0.6 * i / 20) for i in range(21)]]
    c.wash(arc[::-1] + [(1000, 262), (950, 272), (900, 258)], hexc('#8EA8BD', 255), wobble=0.3, blur=0.3, edge=False)
    c.ink(port, width=10, closed=True, color=hexc('#6E7680', 255))
    c.ink(port, width=2, closed=True)
    # Pupitre et consoles.
    desk = [(-20, 640), (-20, 440), (1220, 440), (1220, 640)]
    c.wash(desk, hexc('#4A525C', 255), wobble=0.3, blur=0.2)
    c.wash([(-20, 430), (1220, 430), (1220, 450), (-20, 450)], hexc('#6E7680', 255), wobble=0.2, blur=0.1)
    c.ink([(-20, 430), (1220, 430)], width=2)
    rack = [(60, 430), (60, 120), (520, 120), (520, 430)]
    c.wash(rack, hexc('#5A626C', 255), wobble=0.3, blur=0.2)
    c.ink(rack, width=2, closed=True)
    for r in range(3):
        y = 150 + r * 90
        c.ink([(60, y + 76), (520, y + 76)], width=1.4)
        for k in range(6):
            x = 90 + k * 70
            c.wash(c.ellipse_pts(x, y + 30, 16, 16, 20), hexc('#2A2E34', 255), wobble=0.1, blur=0.1)
            c.ink(c.ellipse_pts(x, y + 30, 16, 16, 20), width=1.4, closed=True)
            a = (k * 1.7 + r) % 6
            c.ink([(x, y + 30), (x + 12 * math.cos(a), y + 30 + 12 * math.sin(a))], width=2, color=hexc('#F3EBDB', 255))
            col = ['#62DDA2', '#E8C870', '#B3321F'][(k + r) % 3]
            c.glow(x, y + 60, 10, hexc(col, 200))
            c.wash(c.ellipse_pts(x, y + 60, 4, 4, 10), hexc(col, 255), wobble=0, blur=0.1, edge=False)
    # Écran d'oscilloscope.
    scr = [(580, 200), (820, 200), (820, 400), (580, 400)]
    c.wash(scr, hexc('#0E2A1E', 255), wobble=0.2, blur=0.1)
    c.glow(700, 300, 140, hexc('#62DDA2', 80))
    c.ink([(590 + x, 300 + 40 * math.sin(x / 14) * math.exp(-((x - 120) / 70) ** 2)) for x in range(0, 222, 3)], width=2.4, color=hexc('#8CF0C0', 255), jitter=0)
    for gx in range(600, 820, 40):
        c.ink([(gx, 200), (gx, 400)], width=0.6, color=hexc('#62DDA2', 70))
    c.ink(scr, width=6, closed=True, color=hexc('#6E7680', 255))
    # Micro, casque, tasse, carnet.
    c.ink([(760, 470), (760, 420), (720, 380)], width=4)
    mic = c.ellipse_pts(712, 372, 16, 22, 20)
    c.wash(mic, hexc('#2A2E34', 255), wobble=0.1, blur=0.1)
    c.ink(mic, width=1.6, closed=True)
    c.ink(c.ellipse_pts(420, 470, 70, 60, 30, math.pi, 2 * math.pi), width=6, color=hexc('#2A2E34', 255))
    for ex in (350, 490):
        c.wash(c.ellipse_pts(ex, 480, 22, 26, 20), hexc('#2A2E34', 255), wobble=0.1, blur=0.1)
    cup = [(900, 500), (950, 500), (946, 560), (904, 560)]
    c.wash(cup, hexc('#B3321F', 255), wobble=0.2, blur=0.1)
    c.ink(cup, width=1.6, closed=True)
    c.ink(c.ellipse_pts(956, 526, 14, 16, 16, -math.pi / 2, math.pi / 2), width=3)
    c.cloud(925, 470, 50, 20, hexc('#FFFFFF', 110), soft=5)
    note = [(1000, 520), (1160, 506), (1170, 600), (1010, 612)]
    c.wash(note, hexc('#F3EBDB', 255), wobble=0.2, blur=0.1)
    c.ink(note, width=1.4, closed=True)
    for k in range(4):
        c.ink([(1020, 536 + k * 18), (1150, 524 + k * 18)], width=1, color=INK + (140,))
    c.finish(f'{OUT}/borealis-radio.png', vignette=0.3)


def generateur():
    c = Canvas(W, H, seed=73)
    c.vgrad(hexc('#2A2824'), hexc('#161412'), 0, H)
    # Grille au sol et tuyaux.
    c.vgrad(hexc('#3A3834'), hexc('#24221E'), 470, 640)
    for x in range(-20, 1220, 30):
        c.ink([(x, 470), (x - 60, 640)], width=1, color=INK + (160,))
    for y in range(480, 640, 24):
        c.ink([(-20, y), (1220, y)], width=1, color=INK + (160,))
    for y, col in ((60, '#6E7680'), (100, '#B3321F'), (130, '#6E7680')):
        c.wash([(-20, y), (1220, y), (1220, y + 18), (-20, y + 18)], hexc(col, 255), wobble=0.2, blur=0.1)
        c.ink([(-20, y), (1220, y)], width=1.4)
        c.ink([(-20, y + 18), (1220, y + 18)], width=1.4)
    # Générateur diesel.
    gen = [(280, 490), (280, 250), (900, 250), (900, 490)]
    c.wash(gen, hexc('#D8B040', 255), wobble=0.3, blur=0.2)
    c.hatch([(700, 490), (700, 250), (900, 250), (900, 490)], spacing=5, angle=80, alpha=90)
    c.ink(gen, width=2.4, closed=True)
    for k in range(10):
        c.ink([(320 + k * 24, 280), (320 + k * 24, 400)], width=4, color=hexc('#8A7020', 255))
    c.ink([(760, 250), (760, 150), (820, 150), (820, 60)], width=14, color=hexc('#4A4640', 255))
    # Panneau : voyants, manette rouge.
    panel = [(580, 300), (680, 300), (680, 440), (580, 440)]
    c.wash(panel, hexc('#3A3834', 255), wobble=0.2, blur=0.1)
    c.ink(panel, width=1.6, closed=True)
    for k, col in enumerate(('#B3321F', '#E8C870', '#62DDA2')):
        c.glow(600 + k * 30, 320, 12, hexc(col, 180))
        c.wash(c.ellipse_pts(600 + k * 30, 320, 6, 6, 12), hexc(col, 255), wobble=0, blur=0.1, edge=False)
    c.ink([(630, 420), (650, 360)], width=5, color=hexc('#B3321F', 255))
    c.wash(c.ellipse_pts(650, 356, 10, 10, 12), hexc('#1D1A16', 255), wobble=0, blur=0)
    # Bandes de danger et jerricans.
    for k in range(12):
        x = 280 + k * 52
        c.wash([(x, 490), (x + 26, 490), (x + 46, 470), (x + 20, 470)], hexc('#1D1A16', 255), wobble=0.1, blur=0.1)
    for x in (1000, 1080):
        can = [(x, 580), (x, 470), (x + 60, 470), (x + 60, 580)]
        c.wash(can, hexc('#B3321F', 255), wobble=0.2, blur=0.1)
        c.ink(can, width=1.8, closed=True)
        c.ink([(x + 10, 480), (x + 50, 570)], width=2)
        c.ink([(x + 50, 480), (x + 10, 570)], width=2)
    # Lampe frontale au sol.
    c.wash([(100, 600), (190, 540), (160, 640), (80, 640)], hexc('#FFF1C4', 60), wobble=0, blur=8, edge=False)
    c.glow(600, 200, 300, hexc('#FFB85C', 50))
    c.finish(f'{OUT}/borealis-generateur.png', vignette=0.35)


def labo():
    c = Canvas(W, H, seed=74)
    c.vgrad(hexc('#C8D0D4'), hexc('#A8B2B8'), 0, H)
    # Grande vitre de quarantaine.
    glass = [(160, 60), (1040, 60), (1040, 480), (160, 480)]
    c.vgrad(hexc('#DDEFF0'), hexc('#B8D8D8'), 60, 480, mask=c.mask_poly(glass))
    # Dans le labo : paillasse, cultures qui brillent.
    c.wash([(160, 360), (1040, 360), (1040, 480), (160, 480)], hexc('#8A949C', 230), wobble=0.3, blur=0.2)
    for k in range(7):
        x = 240 + k * 110
        jar = [(x - 26, 360), (x - 26, 280), (x - 16, 270), (x + 16, 270), (x + 26, 280), (x + 26, 360)]
        c.glow(x, 320, 50, hexc('#E8C050', 120))
        c.wash(jar, hexc('#F4F8F8', 180), wobble=0.2, blur=0.1)
        c.wash([(x - 24, 360), (x - 24, 310), (x + 24, 310), (x + 24, 360)], hexc('#D8B040', 220), wobble=0.4, blur=0.3, edge=False)
        c.dots(6, (x - 20, 290, x + 20, 350), hexc('#FFF1B0', 255), 1.5, 3)
        c.ink(jar, width=1.4, closed=True)
    c.wash([(800, 60), (900, 60), (700, 480), (600, 480)], hexc('#FFFFFF', 60), wobble=0, blur=6, edge=False)
    c.ink(glass, width=10, closed=True, color=hexc('#6E7680', 255))
    c.ink(glass, width=2, closed=True)
    # Panneau biohazard.
    sx, sy = 600, 110
    tri = [(sx, sy - 34), (sx + 38, sy + 30), (sx - 38, sy + 30)]
    c.wash(tri, hexc('#E8C870', 255), wobble=0.1, blur=0.1)
    c.ink(tri, width=3, closed=True)
    for a in range(3):
        ang = -math.pi / 2 + a * 2 * math.pi / 3
        c.ink(c.ellipse_pts(sx + 9 * math.cos(ang), sy + 10 + 9 * math.sin(ang), 8, 8, 16), width=2, closed=True)
    # Côté couloir : sol.
    c.vgrad(hexc('#6E7680'), hexc('#4A525C'), 490, 640)
    c.ink([(-20, 490), (1220, 490)], width=2)
    # Interphone.
    ic = [(1080, 250), (1150, 250), (1150, 350), (1080, 350)]
    c.wash(ic, hexc('#4A525C', 255), wobble=0.2, blur=0.1)
    c.ink(ic, width=1.6, closed=True)
    for k in range(4):
        c.ink([(1094, 270 + k * 10), (1136, 270 + k * 10)], width=1.4, color=hexc('#1D1A16', 255))
    c.glow(1115, 330, 10, hexc('#62DDA2', 220))
    c.finish(f'{OUT}/borealis-labo.png', vignette=0.25)


if __name__ == '__main__':
    only = sys.argv[2:] or ['exterieur', 'couloir', 'spores', 'radio', 'generateur', 'labo']
    for name in only:
        globals()[name]()
