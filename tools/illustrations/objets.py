"""Objets et ennemis : un sujet centré sur fond de papier, carré 512."""
import math
import sys

from bg_lisbonne import tile
from cuisine import kouign
from kit import INK, Canvas, hexc
from pirates import tentacle, wave_band

OUT = sys.argv[1] if len(sys.argv) > 1 else 'out'
S = 512


def base(seed, top='#F3EBDB', bottom='#E4D5B8'):
    c = Canvas(S, S, seed=seed)
    c.vgrad(hexc(top), hexc(bottom), 0, S)
    return c


def shadow(c, cx=256, cy=420, rx=150, ry=22):
    c.wash(c.ellipse_pts(cx, cy, rx, ry, 40), hexc('#5A4632', 70), wobble=0.3, blur=6, edge=False)


def rot(pts, cx, cy, deg):
    a = math.radians(deg)
    ca, sa = math.cos(a), math.sin(a)
    return [(cx + (x - cx) * ca - (y - cy) * sa, cy + (x - cx) * sa + (y - cy) * ca) for x, y in pts]


def rect(x0, y0, x1, y1):
    return [(x0, y0), (x1, y0), (x1, y1), (x0, y1)]


def done(c, name):
    c.finish(f'{OUT}/{name}.png', vignette=0.25)


# ---------- Lepic ----------

def lettre():
    c = base(100)
    shadow(c, 256, 380, 170, 26)
    env = rot(rect(100, 170, 412, 370), 256, 270, -6)
    c.wash(env, hexc('#F7EEDD', 255), wobble=0.3, blur=0.2)
    c.ink(env, width=2.2, closed=True)
    flap = rot([(100, 170), (256, 290), (412, 170)], 256, 270, -6)
    c.wash(flap, hexc('#EFE2C8', 255), wobble=0.2, blur=0.1)
    c.ink(flap, width=1.8)
    c.ink(rot([(100, 370), (220, 270)], 256, 270, -6), width=1.2, color=INK + (120,))
    c.ink(rot([(412, 370), (292, 270)], 256, 270, -6), width=1.2, color=INK + (120,))
    sx, sy = rot([(256, 290)], 256, 270, -6)[0]
    seal = [(sx + 34 * math.cos(a) * (1 + 0.08 * math.sin(7 * a)), sy + 34 * math.sin(a) * (1 + 0.08 * math.sin(7 * a))) for a in [i / 40 * 2 * math.pi for i in range(41)]]
    c.wash(seal, hexc('#B3321F', 255), wobble=0.4, blur=0.2)
    c.ink(seal, width=1.6, closed=True)
    c.ink(c.ellipse_pts(sx, sy, 20, 20, 24), width=1.4, closed=True, color=hexc('#7A1A10', 255))
    c.ink([(sx - 8, sy - 6), (sx, sy + 10), (sx + 8, sy - 6)], width=2, color=hexc('#7A1A10', 255))
    # Écriture penchée.
    for k in range(2):
        pts = [(150 + x, 330 + k * 14 - x * 0.1 + 3 * math.sin(x / 5)) for x in range(0, 90, 3)]
        c.ink(rot(pts, 256, 270, -6), width=1.2, color=hexc('#2F4E6E', 220))
    done(c, 'lepic-lettre')


def billet():
    c = base(101)
    shadow(c, 256, 360, 190, 22)
    t = rot(rect(70, 180, 442, 330), 256, 255, 8)
    c.wash(t, hexc('#E8C870', 255), wobble=0.3, blur=0.2)
    c.ink(t, width=2.2, closed=True)
    stub = rot([(350, 180), (350, 330)], 256, 255, 8)
    for k in range(12):
        p = rot([(350, 186 + k * 12)], 256, 255, 8)[0]
        c.wash(c.ellipse_pts(p[0], p[1], 2.4, 2.4, 8), hexc('#7A5A20', 255), wobble=0, blur=0, edge=False)
    c.wash(rot(rect(84, 196, 336, 216), 256, 255, 8), hexc('#8C1F1A', 255), wobble=0.2, blur=0.1)
    for k, w in enumerate((200, 160, 120)):
        c.ink(rot([(96, 246 + k * 22), (96 + w, 246 + k * 22)], 256, 255, 8), width=3 if k == 0 else 2, color=INK + (200,))
    # Masques du théâtre sur le talon.
    mx, my = rot([(396, 255)], 256, 255, 8)[0]
    face = c.ellipse_pts(mx, my, 22, 28, 24)
    c.wash(face, hexc('#F7EEDD', 255), wobble=0.2, blur=0.1)
    c.ink(face, width=1.6, closed=True)
    for ex in (-8, 8):
        c.wash(c.ellipse_pts(mx + ex, my - 6, 4, 3, 10), hexc('#1D1A16', 255), wobble=0, blur=0)
    c.ink([(mx - 10, my + 10), (mx, my + 16), (mx + 10, my + 10)], width=2)
    c.ink(stub, width=1.2, color=INK + (140,))
    done(c, 'lepic-billet')


def violette():
    c = base(102)
    shadow(c, 256, 420, 120, 18)
    c.ink([(256, 420), (250, 300), (262, 200)], width=3, color=hexc('#4A6B3A', 255))
    for lx, ly, a in ((220, 360, -30), (294, 330, 30)):
        leaf = [(256, ly + 20), (lx, ly), (256 + (lx - 256) * 0.4, ly - 30)]
        leaf = c.ellipse_pts(lx, ly, 42, 22, 24)
        leaf = rot(leaf, lx, ly, a)
        c.wash(leaf, hexc('#5E7E48', 255), wobble=0.4, blur=0.2)
        c.ink(leaf, width=1.4, closed=True)
    # Fleur : cinq pétales violets, cœur jaune.
    fx, fy = 262, 180
    for k, (dx, dy, r) in enumerate(((-34, -20, 30), (34, -20, 30), (-30, 22, 28), (30, 22, 28), (0, 40, 32))):
        pet = c.ellipse_pts(fx + dx, fy + dy, r, r * 0.8, 24)
        c.wash(pet, hexc('#6B4A9A' if k < 2 else '#7E5AB0', 255), wobble=0.4, blur=0.2)
        c.ink(pet, width=1.4, closed=True)
    for dx in (-10, 0, 10):
        c.ink([(fx, fy + 20), (fx + dx * 2, fy + 44)], width=1, color=hexc('#3A2A5A', 200))
    c.wash(c.ellipse_pts(fx, fy + 6, 10, 10, 16), hexc('#F2C94C', 255), wobble=0.2, blur=0.1)
    done(c, 'lepic-violette')


# ---------- Lisbonne ----------

def cle():
    c = base(110)
    shadow(c, 256, 400, 170, 20)
    # Clé ancienne en laiton.
    key = rot(rect(150, 244, 380, 262), 256, 256, -20)
    c.wash(key, hexc('#C9A040', 255), wobble=0.2, blur=0.1)
    c.ink(key, width=1.8, closed=True)
    ring = rot(c.ellipse_pts(130, 253, 38, 38, 30), 256, 256, -20)
    c.wash(ring, hexc('#C9A040', 255), wobble=0.2, blur=0.1)
    c.ink(ring, width=1.8, closed=True)
    hole = rot(c.ellipse_pts(130, 253, 18, 18, 20), 256, 256, -20)
    c.wash(hole, hexc('#F3EBDB', 255), wobble=0.1, blur=0.1, edge=False)
    c.ink(hole, width=1.6, closed=True)
    bit = rot([(330, 262), (330, 300), (350, 300), (350, 284), (366, 284), (366, 300), (380, 300), (380, 262)], 256, 256, -20)
    c.wash(bit, hexc('#C9A040', 255), wobble=0.2, blur=0.1)
    c.ink(bit, width=1.8, closed=True)
    # Anneau et sardine en porte-clés.
    rx, ry = rot([(96, 253)], 256, 256, -20)[0]
    c.ink(c.ellipse_pts(rx - 10, ry + 30, 22, 22, 24), width=3, closed=True, color=hexc('#8A949C', 255))
    sx, sy = rx + 40, ry + 120
    fish = [(sx - 70, sy), (sx - 30, sy - 26), (sx + 40, sy - 18), (sx + 60, sy), (sx + 40, sy + 18), (sx - 30, sy + 24)]
    c.wash(fish, hexc('#8FA8B8', 255), wobble=0.4, blur=0.2)
    c.wash([(sx - 60, sy - 4), (sx + 40, sy - 12), (sx + 40, sy - 2), (sx - 60, sy + 4)], hexc('#2F5C99', 200), wobble=0.2, blur=0.1, edge=False)
    tail = [(sx + 56, sy), (sx + 86, sy - 22), (sx + 80, sy), (sx + 86, sy + 22)]
    c.wash(tail, hexc('#8FA8B8', 255), wobble=0.2, blur=0.1)
    c.ink(fish, width=1.8, closed=True)
    c.ink(tail, width=1.6, closed=True)
    c.wash(c.ellipse_pts(sx - 44, sy - 6, 5, 5, 10), hexc('#1D1A16', 255), wobble=0, blur=0)
    c.ink([(sx - 30, sy - 22), (sx - 26, sy + 20)], width=1.2)
    c.ink([(rx - 10, ry + 52), (sx - 60, sy - 10)], width=2, color=hexc('#8A949C', 255))
    done(c, 'lisbonne-cle')


def book(c, cx, cy, w, h, cover, deg=0, label='#E8C870'):
    body = rot(rect(cx - w / 2, cy - h / 2, cx + w / 2, cy + h / 2), cx, cy, deg)
    pages = rot(rect(cx - w / 2 + 8, cy + h / 2 - 4, cx + w / 2 - 2, cy + h / 2 + 14), cx, cy, deg)
    c.wash(pages, hexc('#F7F0E0', 255), wobble=0.2, blur=0.1)
    c.ink(pages, width=1.4, closed=True)
    c.wash(body, hexc(cover, 255), wobble=0.3, blur=0.2)
    c.hatch(body, spacing=6, angle=60, alpha=40)
    c.ink(body, width=2, closed=True)
    c.ink(rot([(cx - w / 2 + 16, cy - h / 2), (cx - w / 2 + 16, cy + h / 2)], cx, cy, deg), width=1.6)
    lab = rot(rect(cx - w * 0.22, cy - h * 0.3, cx + w * 0.34, cy - h * 0.1), cx, cy, deg)
    c.wash(lab, hexc(label, 255), wobble=0.2, blur=0.1)
    c.ink(lab, width=1.4, closed=True)
    return body


def dico():
    c = base(111)
    shadow(c, 256, 410, 150, 22)
    book(c, 256, 256, 220, 290, '#2E6030', deg=-8)
    for k in range(3):
        c.ink(rot([(226, 190 + k * 10), (310, 190 + k * 10)], 256, 256, -8), width=2 if k == 1 else 1.2, color=INK + (200,))
    # Ruban marque-page.
    c.ink(rot([(290, 400), (296, 440), (284, 452)], 256, 256, -8), width=6, color=hexc('#B3321F', 255))
    done(c, 'lisbonne-dico')


def vinyle():
    c = base(112)
    shadow(c, 256, 420, 180, 22)
    sleeve = rot(rect(90, 110, 360, 380), 200, 245, -6)
    c.wash(sleeve, hexc('#2A2622', 255), wobble=0.3, blur=0.2)
    # Silhouette au châle sur la pochette.
    c.wash(c.ellipse_pts(222, 200, 26, 30, 24), hexc('#E8DCC4', 230), wobble=0.3, blur=0.2)
    c.wash([(170, 340), (190, 240), (254, 240), (274, 340)], hexc('#E8DCC4', 230), wobble=0.3, blur=0.2)
    c.ink(rot([(120, 140), (240, 140)], 200, 245, -6), width=3, color=hexc('#E8C870', 255))
    c.ink(sleeve, width=2.2, closed=True)
    disc = c.ellipse_pts(330, 250, 130, 130, 60)
    c.wash(disc, hexc('#1D1A16', 255), wobble=0.2, blur=0.1)
    for r in (110, 94, 78, 62):
        c.ink(c.ellipse_pts(330, 250, r, r, 60), width=0.8, closed=True, color=hexc('#5A5046', 200))
    c.wash([(360, 150), (420, 190), (400, 210), (346, 170)], hexc('#FFFFFF', 50), wobble=0.3, blur=4, edge=False)
    lab = c.ellipse_pts(330, 250, 40, 40, 30)
    c.wash(lab, hexc('#B3321F', 255), wobble=0.2, blur=0.1)
    c.ink(lab, width=1.4, closed=True)
    c.wash(c.ellipse_pts(330, 250, 5, 5, 12), hexc('#F3EBDB', 255), wobble=0, blur=0)
    c.ink(disc, width=2, closed=True)
    done(c, 'lisbonne-vinyle')


def azulejo():
    c = base(113)
    shadow(c, 256, 410, 170, 22)
    x0, y0, s = 106, 96, 300
    c.wash(rot(rect(x0 + 8, y0 + 12, x0 + s + 8, y0 + s + 12), 256, 246, 5), hexc('#8A7A64', 180), wobble=0.2, blur=3, edge=False)
    tile(c, x0, y0, s, 0)
    c.ink(rect(x0, y0, x0 + s, y0 + s), width=2.4, closed=True)
    # Fêlure.
    crack = [(x0 + 40, y0), (x0 + 90, y0 + 70), (x0 + 80, y0 + 110), (x0 + 150, y0 + 170), (x0 + 140, y0 + 220), (x0 + 210, y0 + s)]
    c.ink(crack, width=2.4, jitter=0.6)
    c.ink([(x0 + 150, y0 + 170), (x0 + 200, y0 + 150)], width=1.4)
    # Coin ébréché.
    chip = [(x0 + s - 50, y0 + s), (x0 + s, y0 + s - 40), (x0 + s, y0 + s)]
    c.wash(chip, hexc('#C8B89A', 255), wobble=0.3, blur=0.1)
    c.ink(chip, width=1.6, closed=True)
    done(c, 'lisbonne-azulejo')


# ---------- Borealis ----------

def lampe():
    c = base(120, '#2A3440', '#1A222C')
    c.wash([(300, 250), (520, 120), (520, 420)], hexc('#FFF1C4', 90), wobble=0, blur=10, edge=False)
    shadow(c, 240, 410, 150, 20)
    # Bandeau élastique.
    strap = c.ellipse_pts(220, 290, 150, 70, 60)
    c.ink(strap, width=18, closed=True, color=hexc('#B3321F', 255))
    c.ink(strap, width=1.4, closed=True)
    for k in range(10):
        a = k / 10 * 2 * math.pi
        x, y = 220 + 150 * math.cos(a), 290 + 70 * math.sin(a)
        c.ink([(x - 4, y - 6), (x + 4, y + 6)], width=1.2, color=hexc('#1D1A16', 160))
    body = [(250, 230), (330, 220), (344, 250), (344, 320), (330, 350), (250, 350)]
    c.wash(body, hexc('#4A525C', 255), wobble=0.3, blur=0.2)
    c.ink(body, width=2, closed=True)
    c.glow(345, 285, 60, hexc('#FFF1C4', 230))
    lens = c.ellipse_pts(345, 285, 22, 44, 30)
    c.wash(lens, hexc('#FFFBEA', 255), wobble=0.1, blur=0.2)
    c.ink(lens, width=2, closed=True)
    c.wash(c.ellipse_pts(280, 240, 8, 5, 12), hexc('#62DDA2', 255), wobble=0, blur=0.1)
    done(c, 'borealis-lampe')


def badge():
    c = base(121)
    shadow(c, 256, 430, 130, 18)
    # Cordon arraché.
    c.ink([(256, 110), (230, 60), (240, 20)], width=8, color=hexc('#2F4E6E', 255))
    c.ink([(256, 110), (290, 60), (300, 40)], width=8, color=hexc('#2F4E6E', 255))
    for dx in (-6, 0, 6):
        c.ink([(300, 40), (304 + dx, 26)], width=1.6, color=hexc('#2F4E6E', 255))
    c.ink([(256, 110), (256, 140)], width=4, color=hexc('#8A949C', 255))
    card = rect(150, 140, 362, 420)
    c.wash(card, hexc('#F4F6F6', 255), wobble=0.2, blur=0.1)
    c.wash(rect(150, 140, 362, 190), hexc('#B3321F', 255), wobble=0.2, blur=0.1)
    c.wash(rect(234, 150, 278, 160), hexc('#F4F6F6', 255), wobble=0.1, blur=0.1, edge=False)
    # Photo : silhouette sans visage.
    ph = rect(176, 210, 256, 310)
    c.wash(ph, hexc('#C8D4DC', 255), wobble=0.1, blur=0.1)
    c.wash(c.ellipse_pts(216, 248, 18, 22, 20), hexc('#6E7680', 255), wobble=0.1, blur=0.1)
    c.wash(c.ellipse_pts(216, 310, 34, 28, 20, math.pi, 2 * math.pi), hexc('#6E7680', 255), wobble=0.1, blur=0.1)
    c.ink(ph, width=1.4, closed=True)
    for k, w in enumerate((70, 60, 50, 64)):
        c.ink([(272, 226 + k * 22), (272 + w, 226 + k * 22)], width=2.4 if k == 0 else 1.6, color=INK + (200,))
    for k in range(18):
        c.ink([(180 + k * 9, 340), (180 + k * 9, 390)], width=1 + (k * 7 % 3), color=hexc('#1D1A16', 255), jitter=0)
    c.ink(card, width=2.2, closed=True)
    done(c, 'borealis-badge')


def journal():
    c = base(122)
    shadow(c, 256, 420, 180, 22)
    body = book(c, 256, 250, 240, 300, '#34466E', deg=6, label='#F3EBDB')
    # Élastique et crayon.
    c.ink(rot([(330, 100), (330, 400)], 256, 250, 6), width=6, color=hexc('#1D1A16', 255))
    pen = rot(rect(120, 420, 400, 436), 256, 428, -10)
    c.wash(pen, hexc('#E8C870', 255), wobble=0.1, blur=0.1)
    c.ink(pen, width=1.6, closed=True)
    tip = rot([(400, 420), (430, 428), (400, 436)], 256, 428, -10)
    c.wash(tip, hexc('#D8B08A', 255), wobble=0.1, blur=0.1)
    c.ink(tip, width=1.4, closed=True)
    done(c, 'borealis-journal')


def thermos():
    c = base(123)
    shadow(c, 256, 440, 110, 18)
    body = [(196, 440), (190, 170), (322, 170), (316, 440)]
    c.wash(body, hexc('#2E6030', 255), wobble=0.3, blur=0.2)
    c.hatch([(280, 440), (282, 170), (322, 170), (316, 440)], spacing=5, angle=85, alpha=90)
    c.wash([(210, 440), (206, 180), (222, 180), (226, 440)], hexc('#FFFFFF', 60), wobble=0.2, blur=3, edge=False)
    c.ink(body, width=2.2, closed=True)
    for y in (220, 400):
        c.ink([(192, y), (320, y)], width=4, color=hexc('#8A949C', 255))
    cap = [(186, 170), (184, 110), (328, 110), (326, 170)]
    c.wash(cap, hexc('#8A949C', 255), wobble=0.2, blur=0.1)
    c.ink(cap, width=2, closed=True)
    c.ink(c.ellipse_pts(256, 110, 72, 12, 30), width=1.6, closed=True)
    c.ink([(322, 250), (370, 260), (370, 360), (318, 370)], width=10, color=hexc('#1D1A16', 255))
    for k in range(3):
        c.ink([(240 + k * 18, 90 - k * 6), (230 + k * 18, 60), (246 + k * 18, 30)], width=3, color=hexc('#FFFFFF', 150))
    done(c, 'borealis-cafe')


# ---------- Cuisine ----------

def carnet():
    c = base(130)
    shadow(c, 256, 420, 180, 22)
    body = book(c, 256, 250, 240, 300, '#B3321F', deg=-5, label='#F3EBDB')
    for cx, cy in ((200, 190), (320, 330), (180, 350)):
        c.wash(c.ellipse_pts(cx, cy, 22, 14, 16), hexc('#F6DE7A', 110), wobble=0.8, blur=2, edge=False)
    # Pages qui dépassent.
    for k in range(3):
        slip = rot(rect(360, 150 + k * 60, 392, 170 + k * 60), 256, 250, -5)
        c.wash(slip, hexc('#F7F0E0', 255), wobble=0.2, blur=0.1)
        c.ink(slip, width=1.2, closed=True)
    done(c, 'cuisine-carnet')


def beurre():
    c = base(131)
    shadow(c, 256, 400, 170, 24)
    paper = [(90, 340), (140, 250), (380, 236), (430, 330), (360, 400), (150, 406)]
    c.wash(paper, hexc('#FBF6EC', 255), wobble=0.6, blur=0.2)
    c.ink(paper, width=1.6, closed=True)
    top = [(150, 260), (340, 244), (370, 290), (180, 308)]
    side = [(180, 308), (370, 290), (366, 350), (182, 368)]
    end = [(150, 260), (180, 308), (182, 368), (152, 318)]
    c.wash(side, hexc('#EAC45A', 255), wobble=0.3, blur=0.2)
    c.wash(end, hexc('#D8B040', 255), wobble=0.3, blur=0.2)
    c.wash(top, hexc('#F6DE7A', 255), wobble=0.3, blur=0.2)
    for p in (side, end, top):
        c.ink(p, width=1.8, closed=True)
    # Traces de couteau et cristaux de sel.
    for k in range(3):
        c.ink([(200 + k * 40, 276 - k * 3), (240 + k * 40, 270 - k * 3)], width=1.4, color=hexc('#B08A30', 220))
    c.dots(18, (190, 250, 340, 300), hexc('#FFFFFF', 255), 1.5, 3)
    # Étiquette bretonne.
    lab = [(210, 320), (320, 312), (322, 344), (212, 352)]
    c.wash(lab, hexc('#2F5C99', 255), wobble=0.2, blur=0.1)
    c.ink(lab, width=1.2, closed=True)
    c.ink([(226, 334), (304, 328)], width=2.4, color=hexc('#F3EBDB', 255))
    done(c, 'cuisine-beurre')


def cidre():
    c = base(132)
    shadow(c, 256, 450, 100, 18)
    b = [(206, 450), (200, 260), (220, 220), (240, 200), (240, 120), (272, 120), (272, 200), (292, 220), (312, 260), (306, 450)]
    c.wash(b, hexc('#4A6B3A', 245), wobble=0.3, blur=0.2)
    c.wash([(212, 440), (208, 270), (226, 262), (228, 440)], hexc('#FFFFFF', 70), wobble=0.2, blur=3, edge=False)
    c.ink(b, width=2.2, closed=True)
    cap = rect(236, 100, 276, 126)
    c.wash(cap, hexc('#C9A040', 255), wobble=0.1, blur=0.1)
    c.ink(cap, width=1.6, closed=True)
    c.ink([(236, 120), (220, 140), (292, 140), (276, 120)], width=1.4, color=hexc('#8A6A20', 255))
    lab = [(212, 300), (300, 300), (300, 400), (212, 400)]
    c.wash(lab, hexc('#F3E6CF', 255), wobble=0.2, blur=0.1)
    c.ink(lab, width=1.6, closed=True)
    ap = c.ellipse_pts(256, 344, 22, 20, 24)
    c.wash(ap, hexc('#C8403A', 255), wobble=0.2, blur=0.1)
    c.ink(ap, width=1.4, closed=True)
    c.ink([(256, 324), (260, 312)], width=2)
    c.wash(c.ellipse_pts(268, 314, 8, 4, 10), hexc('#4A6B3A', 255), wobble=0.1, blur=0.1)
    c.ink([(226, 384), (286, 384)], width=2, color=INK + (200,))
    done(c, 'cuisine-cidre')


def astuce():
    c = base(133)
    shadow(c, 256, 440, 110, 18)
    t = rot([(170, 60)] + [(170 + k * 15, 450 + (8 if k % 2 else 0)) for k in range(12)][::1] + [(342, 60)], 256, 256, 4)
    t = rot([(176, 50), (336, 50)] + [(336 - k * 16, 450 + (10 if k % 2 else 0)) for k in range(11)], 256, 256, 4)
    c.wash(t, hexc('#FBF8F0', 255), wobble=0.3, blur=0.2)
    c.ink(t, width=1.8, closed=True)
    for k, w in enumerate((110, 80, 100, 60)):
        c.ink(rot([(196, 90 + k * 24), (196 + w, 90 + k * 24)], 256, 256, 4), width=1.6, color=hexc('#6E7680', 255))
    c.ink(rot([(196, 190), (316, 190)], 256, 256, 4), width=1.2, color=hexc('#6E7680', 200))
    # Écriture manuscrite au stylo bleu.
    for k in range(5):
        y = 230 + k * 36
        pts = [(196 + x, y + 5 * math.sin(x / 6 + k) - x * 0.05) for x in range(0, 110 - k * 8, 3)]
        c.ink(rot(pts, 256, 256, 4), width=2, color=hexc('#2F4E6E', 240))
    # Pincée de fleur de sel.
    c.dots(26, (300, 380, 380, 440), hexc('#FFFFFF', 255), 2, 4)
    c.dots(26, (300, 380, 380, 440), hexc('#C8CED3', 255), 1, 2)
    done(c, 'cuisine-astuce')


def caramel():
    c = base(134)
    shadow(c, 256, 380, 190, 22)
    # Papillote torsadée.
    for side in (-1, 1):
        w = [(256 + side * 80, 256), (256 + side * 190, 190), (256 + side * 170, 256), (256 + side * 190, 322)]
        c.wash(w, hexc('#E8C870', 255), wobble=0.6, blur=0.2)
        c.ink(w, width=1.6, closed=True)
        for k in range(3):
            c.ink([(256 + side * 96, 256), (256 + side * 180, 210 + k * 46)], width=1, color=hexc('#B08A30', 220))
    candy = c.ellipse_pts(256, 256, 100, 72, 40)
    c.wash(candy, hexc('#B8702A', 255), wobble=0.3, blur=0.2)
    c.wash(c.ellipse_pts(256, 280, 84, 40, 30), hexc('#8A4A16', 140), wobble=0.3, blur=6, edge=False)
    c.wash(c.ellipse_pts(226, 226, 40, 14, 20), hexc('#FBE3A6', 150), wobble=0.3, blur=4, edge=False)
    c.ink(candy, width=2, closed=True)
    c.dots(10, (190, 220, 320, 300), hexc('#FFFFFF', 200), 1, 2)
    done(c, 'cuisine-caramel')


# ---------- Pirates ----------

def rhum():
    c = base(140)
    shadow(c, 256, 440, 120, 20)
    f = [(170, 440), (160, 250), (190, 200), (230, 190), (230, 130), (282, 130), (282, 190), (322, 200), (352, 250), (342, 440)]
    c.wash(f, hexc('#8A5A32', 255), wobble=0.4, blur=0.2)
    c.hatch(f, spacing=6, angle=70, alpha=60)
    c.wash([(180, 430), (174, 260), (196, 250), (200, 430)], hexc('#FFFFFF', 50), wobble=0.3, blur=3, edge=False)
    c.ink(f, width=2.2, closed=True)
    # Cordage et étiquette tête de mort.
    c.ink([(160, 300), (352, 300)], width=6, color=hexc('#C8A878', 255))
    c.ink([(160, 300), (352, 300)], width=1.2)
    lab = c.ellipse_pts(256, 370, 56, 44, 30)
    c.wash(lab, hexc('#F3E6CF', 255), wobble=0.2, blur=0.1)
    c.ink(lab, width=1.6, closed=True)
    sk = c.ellipse_pts(256, 362, 20, 18, 20)
    c.wash(sk, hexc('#1D1A16', 255), wobble=0.1, blur=0.1)
    for ex in (-7, 7):
        c.wash(c.ellipse_pts(256 + ex, 360, 5, 5, 10), hexc('#F3E6CF', 255), wobble=0, blur=0)
    c.ink([(226, 396), (286, 382)], width=3)
    c.ink([(226, 382), (286, 396)], width=3)
    cork = [(236, 132), (232, 96), (280, 96), (276, 132)]
    c.wash(cork, hexc('#C8965A', 255), wobble=0.2, blur=0.1)
    c.ink(cork, width=1.8, closed=True)
    done(c, 'pirates-rhum')


def sabre():
    c = base(141)
    shadow(c, 256, 410, 210, 20)
    blade = [(170, 340), (430, 110), (440, 120), (400, 190), (184, 360)]
    blade = [(180, 350)] + [(180 + t * 260, 350 - t * 250 - 40 * math.sin(t * math.pi)) for t in [i / 10 for i in range(11)]] + [(446, 96)]
    back = [(186 + t * 240, 362 - t * 232 - 30 * math.sin(t * math.pi)) for t in [i / 10 for i in range(10, -1, -1)]]
    c.wash(blade + back, hexc('#C8CED3', 255), wobble=0.3, blur=0.1)
    c.hatch(blade + back, spacing=4, angle=-45, alpha=60)
    c.ink(blade + back, width=2, closed=True)
    # Ébréchures.
    for t in (0.35, 0.6):
        x, y = 180 + t * 260, 350 - t * 250 - 40 * math.sin(t * math.pi)
        c.wash([(x - 8, y), (x - 2, y + 10), (x + 6, y + 2)], hexc('#E4D5B8', 255), wobble=0.1, blur=0.1)
        c.ink([(x - 8, y), (x - 2, y + 10), (x + 6, y + 2)], width=1.4)
    guard = c.ellipse_pts(176, 362, 44, 16, 24)
    guard = rot(guard, 176, 362, -45)
    c.wash(guard, hexc('#C9A040', 255), wobble=0.2, blur=0.1)
    c.ink(guard, width=1.8, closed=True)
    grip = rot(rect(110, 354, 168, 374), 139, 364, -45)
    grip = [(170, 370), (120, 420), (106, 406), (156, 356)]
    c.wash(grip, hexc('#5E3A1E', 255), wobble=0.2, blur=0.1)
    for k in range(5):
        c.ink([(160 - k * 10, 366 + k * 10 - 12), (166 - k * 10, 372 + k * 10)], width=1.2)
    c.ink(grip, width=1.8, closed=True)
    c.wash(c.ellipse_pts(104, 422, 12, 12, 16), hexc('#C9A040', 255), wobble=0.1, blur=0.1)
    c.ink(c.ellipse_pts(104, 422, 12, 12, 16), width=1.6, closed=True)
    done(c, 'pirates-sabre')


def carte():
    c = base(142)
    shadow(c, 256, 420, 200, 22)
    m = [(70, 130), (440, 110), (450, 390), (80, 410)]
    c.wash(m, hexc('#E8D5A8', 255), wobble=1, blur=0.3)
    c.hatch(m, spacing=9, angle=30, alpha=25)
    for side in ((70, 130), (80, 410)):
        roll = c.ellipse_pts(side[0], (130 + 410) / 2, 16, 150, 30)
    c.ink(m, width=2.2, closed=True)
    # Île.
    isl = [(170, 280), (200, 200), (270, 180), (340, 200), (370, 260), (330, 320), (250, 340), (190, 320)]
    c.wash(isl, hexc('#B8C48A', 255), wobble=3, blur=0.3)
    c.ink(isl, width=1.8, closed=True)
    for k in range(3):
        c.ink([(150 - k * 12, 290 + k * 14), (180 - k * 12, 300 + k * 14)], width=1, color=hexc('#2F5C99', 180))
    # Chemin en pointillés et croix rouge.
    path = [(200, 300), (230, 270), (260, 280), (290, 240), (310, 230)]
    for i in range(len(path) - 1):
        a, b = path[i], path[i + 1]
        c.ink([a, ((a[0] + b[0]) / 2, (a[1] + b[1]) / 2)], width=2, color=hexc('#5E3A1E', 255))
    c.ink([(300, 220), (324, 244)], width=5, color=hexc('#B3321F', 255))
    c.ink([(324, 220), (300, 244)], width=5, color=hexc('#B3321F', 255))
    # Rose des vents.
    rx, ry = 390, 170
    for a in range(4):
        ang = a * math.pi / 2
        c.ink([(rx, ry), (rx + 30 * math.cos(ang), ry + 30 * math.sin(ang))], width=2)
    c.ink(c.ellipse_pts(rx, ry, 12, 12, 16), width=1.4, closed=True)
    c.wash([(rx - 4, ry - 30), (rx, ry - 42), (rx + 4, ry - 30)], hexc('#1D1A16', 255), wobble=0, blur=0)
    # Tache de cire.
    c.wash(c.ellipse_pts(120, 360, 16, 12, 16), hexc('#F3E6CF', 200), wobble=0.8, blur=0.4)
    done(c, 'pirates-carte')


def biscuit():
    c = base(143)
    shadow(c, 256, 380, 170, 22)
    for k, (cx, cy, r) in enumerate(((210, 290, 110), (310, 250, 110))):
        side = [(x, y + 18) for x, y in c.ellipse_pts(cx, cy, r, r * 0.55, 40)]
        c.wash(side, hexc('#A8743E', 255), wobble=0.6, blur=0.2)
        c.ink(side, width=1.8, closed=True)
        top = c.ellipse_pts(cx, cy, r, r * 0.55, 40)
        c.wash(top, hexc('#D8A860', 255), wobble=0.8, blur=0.2)
        c.hatch(top, spacing=8, angle=20, alpha=30)
        c.ink(top, width=2, closed=True)
        for a in range(9):
            ang = a / 9 * 2 * math.pi
            for rr in (0.35, 0.7):
                c.wash(c.ellipse_pts(cx + r * rr * math.cos(ang), cy + r * 0.55 * rr * math.sin(ang), 4, 3, 10), hexc('#6B3A12', 230), wobble=0, blur=0.1)
    # Miettes.
    c.dots(20, (120, 360, 400, 400), hexc('#A8743E', 255), 2, 4)
    done(c, 'pirates-biscuit')


# ---------- Ennemis (portrait rond, sujet centré) ----------

def malgrin():
    c = base(150, '#C8B89A', '#8A7A64')
    c.glow(256, 200, 220, hexc('#F3E6CF', 120))
    # Épaules et gilet.
    body = [(40, 520), (70, 400), (160, 350), (352, 350), (442, 400), (472, 520)]
    c.wash(body, hexc('#5E3A1E', 255), wobble=0.4, blur=0.2)
    c.wash([(210, 350), (302, 350), (290, 520), (222, 520)], hexc('#E8DCC4', 255), wobble=0.3, blur=0.2)
    for y in range(360, 520, 22):
        c.ink([(214, y), (298, y)], width=5, color=hexc('#2F4E6E', 230))
    c.ink(body, width=2.2, closed=True)
    c.ink([(210, 350), (222, 520)], width=1.8)
    c.ink([(302, 350), (290, 520)], width=1.8)
    # Cou et tête carrée, barbe drue.
    c.wash(rect(222, 300, 290, 360), hexc('#B8805A', 255), wobble=0.2, blur=0.1)
    head = [(176, 240), (180, 150), (210, 110), (302, 110), (332, 150), (336, 240), (320, 300), (256, 330), (192, 300)]
    c.wash(head, hexc('#C88E64', 255), wobble=0.4, blur=0.2)
    beard = [(180, 230), (196, 300), (256, 342), (316, 300), (332, 230), (300, 262), (256, 270), (212, 262)]
    c.wash(beard, hexc('#3A2A22', 255), wobble=0.8, blur=0.3)
    c.hatch(beard, spacing=4, angle=80, alpha=120)
    c.ink(head, width=2.2, closed=True)
    # Bandana rouge noué.
    band = [(172, 170), (190, 108), (256, 84), (322, 108), (340, 170), (300, 150), (212, 150)]
    c.wash(band, hexc('#B3321F', 255), wobble=0.4, blur=0.2)
    c.dots(12, (200, 100, 320, 150), hexc('#F3EBDB', 230), 3, 4)
    c.ink(band, width=2, closed=True)
    c.wash([(336, 150), (380, 130), (372, 176)], hexc('#B3321F', 255), wobble=0.3, blur=0.1)
    c.wash([(336, 160), (384, 190), (352, 204)], hexc('#9A2A1A', 255), wobble=0.3, blur=0.1)
    # Yeux plissés, sourcils épais, cicatrice, nez cassé.
    for ex in (-36, 36):
        c.ink([(256 + ex - 22, 186 - (4 if ex < 0 else -4)), (256 + ex + 22, 186 + (4 if ex < 0 else -4))], width=7, color=hexc('#2A1E14', 255))
        c.wash(c.ellipse_pts(256 + ex, 206, 12, 5, 16), hexc('#1D1A16', 255), wobble=0.1, blur=0.1)
    c.ink([(288, 170), (314, 240)], width=2.4, color=hexc('#8A3A2A', 255))
    c.ink([(256, 196), (248, 236), (266, 244)], width=2)
    c.ink([(234, 280), (256, 274), (280, 282)], width=3, color=hexc('#5A1A10', 255))
    # Anneau d'oreille et coutelas.
    c.ink(c.ellipse_pts(172, 236, 9, 12, 16), width=3, closed=True, color=hexc('#C9A040', 255))
    blade = [(380, 520), (400, 360), (430, 330), (426, 380), (408, 520)]
    c.wash(blade, hexc('#C8CED3', 255), wobble=0.2, blur=0.1)
    c.ink(blade, width=1.8, closed=True)
    done(c, 'pirates-malgrin')


def kraken():
    c = base(151, '#2A3C4A', '#121C26')
    c.glow(256, 256, 260, hexc('#4F90A8', 90))
    rise = [(262 + 46 * math.sin(t * math.pi), 560 - 350 * t) for t in [i / 18 for i in range(19)]]
    curl = []
    for i in range(1, 22):
        a = -i * 0.2
        r = 66 - i * 1.4
        curl.append((196 + r * math.cos(a), 210 + r * math.sin(a)))
    tentacle(c, rise + curl, 72, 8, hexc('#9A3F30', 255))
    for i, (y, a, l, col) in enumerate([(430, 16, 120, '#2F4656'), (470, 20, 150, '#263C4A')]):
        wave_band(c, y, a, l, hexc(col, 245), depth=120, phase=i * 1.7)
    c.dots(60, (40, 360, 480, 440), hexc('#E8F4F8', 200), 1.5, 3.5)
    done(c, 'pirates-kraken')


def corbeau():
    c = base(152, '#6B7A88', '#2A3038')
    c.glow(256, 180, 220, hexc('#E8DCC4', 90))
    # Manteau noir à revers dorés.
    coat = [(30, 520), (60, 390), (170, 340), (342, 340), (452, 390), (482, 520)]
    c.wash(coat, hexc('#1D1A16', 255), wobble=0.4, blur=0.2)
    c.wash([(200, 344), (256, 460), (312, 344)], hexc('#8C1F1A', 255), wobble=0.3, blur=0.2)
    c.ink([(200, 344), (256, 460), (312, 344)], width=4, color=hexc('#C9A040', 255))
    for y in (400, 440, 480):
        c.wash(c.ellipse_pts(186, y, 6, 6, 12), hexc('#C9A040', 255), wobble=0, blur=0)
        c.wash(c.ellipse_pts(326, y, 6, 6, 12), hexc('#C9A040', 255), wobble=0, blur=0)
    c.ink(coat, width=2.2, closed=True)
    # Visage mince dans l'ombre du tricorne.
    head = [(196, 210), (200, 150), (312, 150), (316, 210), (296, 290), (256, 320), (216, 290)]
    c.wash(head, hexc('#B8906E', 255), wobble=0.3, blur=0.2)
    c.wash([(196, 150), (316, 150), (316, 214), (196, 214)], hexc('#2A1E14', 150), wobble=0.3, blur=4, edge=False)
    c.ink(head, width=2, closed=True)
    for ex in (-26, 26):
        c.wash(c.ellipse_pts(256 + ex, 200, 10, 4, 12), hexc('#F3E6CF', 255), wobble=0, blur=0.1)
        c.wash(c.ellipse_pts(256 + ex, 200, 4, 4, 10), hexc('#1D1A16', 255), wobble=0, blur=0)
    c.ink([(256, 204), (246, 250), (262, 256)], width=2)
    c.ink([(226, 276), (256, 282), (290, 270)], width=2.4)
    # Moustache fine et barbiche.
    c.ink([(220, 266), (240, 260), (256, 264), (272, 260), (292, 266)], width=3, color=hexc('#1D1A16', 255))
    c.wash([(246, 296), (266, 296), (256, 330)], hexc('#1D1A16', 255), wobble=0.2, blur=0.1)
    # Cheveux longs noirs.
    for side in (-1, 1):
        hair = [(256 + side * 56, 150), (256 + side * 74, 220), (256 + side * 86, 340), (256 + side * 60, 330), (256 + side * 60, 220)]
        c.wash(hair, hexc('#1D1A16', 255), wobble=0.5, blur=0.2)
    # Tricorne à plume.
    hat = [(120, 160), (160, 90), (256, 60), (352, 90), (392, 160), (320, 138), (256, 150), (192, 138)]
    c.wash(hat, hexc('#1D1A16', 255), wobble=0.4, blur=0.2)
    c.ink([(128, 156), (192, 134), (256, 146), (320, 134), (384, 156)], width=3, color=hexc('#C9A040', 255))
    c.ink(hat, width=2, closed=True)
    feather = [(330, 90), (420, 20), (440, 30), (350, 100)]
    c.wash(feather, hexc('#8C1F1A', 255), wobble=0.4, blur=0.2)
    c.ink([(334, 96), (436, 26)], width=1.4)
    # Crâne sur le tricorne.
    c.wash(c.ellipse_pts(256, 104, 14, 12, 16), hexc('#F3E6CF', 255), wobble=0.1, blur=0.1)
    # Corbeau sur l'épaule.
    rx, ry = 100, 330
    bird = [(rx - 44, ry + 20), (rx - 30, ry - 20), (rx + 10, ry - 34), (rx + 40, ry - 20), (rx + 30, ry + 10), (rx - 10, ry + 30)]
    c.wash(bird, hexc('#2A2E3A', 255), wobble=0.4, blur=0.2)
    c.ink(bird, width=1.8, closed=True)
    c.wash(c.ellipse_pts(rx + 28, ry - 36, 18, 16, 16), hexc('#2A2E3A', 255), wobble=0.2, blur=0.1)
    c.wash([(rx + 42, ry - 40), (rx + 66, ry - 32), (rx + 42, ry - 28)], hexc('#3A3430', 255), wobble=0.1, blur=0.1)
    c.wash(c.ellipse_pts(rx + 32, ry - 40, 3, 3, 8), hexc('#E8C870', 255), wobble=0, blur=0)
    done(c, 'pirates-corbeau')


ALL = ['lettre', 'billet', 'violette', 'cle', 'dico', 'vinyle', 'azulejo', 'lampe', 'badge', 'journal', 'thermos',
       'carnet', 'beurre', 'cidre', 'astuce', 'caramel', 'rhum', 'sabre', 'carte', 'biscuit', 'malgrin', 'kraken', 'corbeau']

if __name__ == '__main__':
    for name in sys.argv[2:] or ALL:
        globals()[name]()
