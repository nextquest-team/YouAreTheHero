import math
import sys

from kit import INK, Canvas, hexc

OUT = sys.argv[1] if len(sys.argv) > 1 else 'out'


def kouign(c, cx, cy, r):
    """Kouign-amann vu de trois quarts : bord festonné, plis gonflés, caramel brillant."""
    ry = r * 0.55
    scal = lambda a, k=1.0: (cx + r * k * (1 + 0.04 * math.sin(8 * a)) * math.cos(a), cy + ry * k * (1 + 0.07 * math.sin(8 * a)) * math.sin(a))
    side = [(x, y + 26) for x, y in [scal(a) for a in [i / 80 * 2 * math.pi for i in range(81)]]]
    c.wash(side, hexc('#8A4A16', 255), wobble=0.6, blur=0.3)
    c.hatch(side, spacing=5, angle=-15, alpha=60)
    c.ink(side, width=2, closed=True)
    top = [scal(a) for a in [i / 80 * 2 * math.pi for i in range(81)]]
    c.wash(top, hexc('#C98530', 255), wobble=0.6, blur=0.3)
    # Plis gonflés : lobes qui se chevauchent, de l'arrière vers l'avant.
    lobes = []
    for k in range(8):
        a = k * 2 * math.pi / 8 + math.pi / 16
        lobes.append((math.sin(a), a))
    for _, a in sorted(lobes):
        lx, ly = cx + r * 0.52 * math.cos(a), cy + ry * 0.52 * math.sin(a)
        lobe = c.ellipse_pts(lx, ly, r * 0.36, ry * 0.4, 40)
        c.wash(lobe, hexc('#DDA04A', 255), wobble=0.8, blur=0.3)
        # Ombre en bas du lobe, reflet en haut.
        c.wash(c.ellipse_pts(lx, ly + ry * 0.16, r * 0.3, ry * 0.2, 30), hexc('#A8621E', 150), wobble=0.4, blur=3, edge=False)
        c.wash(c.ellipse_pts(lx - r * 0.08, ly - ry * 0.18, r * 0.14, ry * 0.07, 20), hexc('#FBE3A6', 110), wobble=0.3, blur=4, edge=False)
        c.ink(lobe[: 30], width=1.5, color=hexc('#6B3A12', 230))
    center = c.ellipse_pts(cx, cy, r * 0.26, ry * 0.3, 30)
    c.wash(center, hexc('#9A5418', 255), wobble=0.5, blur=0.3)
    c.ink(center, width=1.6, closed=True, color=hexc('#5A2E0E', 255))
    # Taches de caramel et sucre.
    for _ in range(14):
        a = c.rng.uniform(0, 2 * math.pi)
        k = c.rng.uniform(0.3, 0.9)
        x, y = cx + r * k * math.cos(a), cy + ry * k * math.sin(a)
        c.wash(c.ellipse_pts(x, y, c.rng.uniform(6, 14), c.rng.uniform(3, 7), 12), hexc('#7A3A0E', 150), wobble=1, blur=1.5, edge=False)
    c.dots(60, (cx - r * 0.7, cy - ry * 0.6, cx + r * 0.7, cy + ry * 0.5), hexc('#FFFFFF', 210), 0.6, 1.5)
    c.ink(top, width=2, closed=True)


def quimper(c, cx, cy, r):
    """Assiette de Quimper accrochée au mur : bord bleu et jaune, bouquet stylisé."""
    c.wash([(x + 6, y + 8) for x, y in c.ellipse_pts(cx, cy, r, r, 40)], hexc('#5A4632', 60), wobble=0, blur=5, edge=False)
    c.wash(c.ellipse_pts(cx, cy, r, r, 40), hexc('#FBF6EC', 255), wobble=0.3, blur=0.2)
    c.ink(c.ellipse_pts(cx, cy, r * 0.9, r * 0.9, 40), width=3, color=hexc('#2F5C99', 255), closed=True)
    c.ink(c.ellipse_pts(cx, cy, r * 0.8, r * 0.8, 40), width=2, color=hexc('#E0B43A', 255), closed=True)
    for k in range(12):
        a = k * math.pi / 6
        c.ink([(cx + r * 0.84 * math.cos(a), cy + r * 0.84 * math.sin(a)), (cx + r * 0.96 * math.cos(a), cy + r * 0.96 * math.sin(a))], width=2, color=hexc('#2F5C99', 255))
    c.ink([(cx, cy + r * 0.5), (cx, cy - r * 0.2)], width=2, color=hexc('#2E6030', 255))
    for dx in (-1, 1):
        c.ink([(cx, cy + r * 0.2), (cx + dx * r * 0.3, cy - r * 0.05)], width=2, color=hexc('#2E6030', 255))
        c.wash(c.ellipse_pts(cx + dx * r * 0.32, cy - r * 0.1, r * 0.1, r * 0.1, 12), hexc('#2F5C99', 255), wobble=0.2, blur=0.1, edge=False)
    c.wash(c.ellipse_pts(cx, cy - r * 0.28, r * 0.13, r * 0.13, 12), hexc('#B3321F', 255), wobble=0.2, blur=0.1, edge=False)
    c.ink(c.ellipse_pts(cx, cy, r, r, 40), width=1.6, closed=True)


def cover():
    c = Canvas(1024, 1024, seed=33)
    # Mur de la cuisine, carrelage blanc en bas.
    c.vgrad(hexc('#F1E3C6'), hexc('#E6D2AE'), 0, 600)
    for y in range(470, 600, 32):
        c.ink([(0, y), (1024, y)], width=1, color=INK + (40,))
        for x in range((y // 32 % 2) * 32, 1024, 64):
            c.ink([(x, y), (x, y + 32)], width=1, color=INK + (40,))
    # Fenêtre sur la mer.
    wx0, wy0, wx1, wy1 = 300, 70, 724, 430
    frame = [(wx0, wy0), (wx1, wy0), (wx1, wy1), (wx0, wy1)]
    c.vgrad(hexc('#BFD8E3'), hexc('#F4E3C4'), wy0, 290, mask=c.mask_poly(frame))
    c.vgrad(hexc('#5B8DA6'), hexc('#2F5C74'), 290, wy1, mask=c.mask_poly([(wx0, 290), (wx1, 290), (wx1, wy1), (wx0, wy1)]))
    c.cloud(420, 150, 160, 18, hexc('#FFFFFF', 200))
    c.cloud(640, 200, 120, 12, hexc('#FFFFFF', 180))
    # Falaise et phare.
    cliff = [(560, 300), (600, 262), (660, 256), (724, 270), (724, 330), (560, 330)]
    c.wash(cliff, hexc('#7A8A5A', 255), wobble=0.6, blur=0.2)
    c.ink(cliff[:4], width=1.4)
    lx, lb = 640, 262
    tower = [(lx - 13, lb), (lx - 9, lb - 110), (lx + 9, lb - 110), (lx + 13, lb)]
    c.wash(tower, hexc('#F7F2E8', 255), wobble=0.2, blur=0.1)
    for k in range(3):
        y = lb - 20 - k * 30
        c.wash([(lx - 12.5 + k, y), (lx + 12.5 - k, y), (lx + 12 - k, y - 14), (lx - 12 + k, y - 14)], hexc('#B3321F', 255), wobble=0.1, blur=0.1, edge=False)
    c.ink(tower, width=1.4, closed=True)
    c.wash([(lx - 8, lb - 110), (lx + 8, lb - 110), (lx + 8, lb - 126), (lx - 8, lb - 126)], hexc('#FFE3A0', 255), wobble=0, blur=0, edge=False)
    c.ink([(lx - 11, lb - 126), (lx, lb - 136), (lx + 11, lb - 126)], width=1.6, closed=True)
    for k in range(6):
        y = 310 + k * 20
        c.ink([(wx0 + 30 + k * 20, y), (wx0 + 120 + k * 12, y)], width=1.2, color=hexc('#E8F2F5', 160))
    # Bateau à voile au loin.
    c.wash([(430, 300), (470, 300), (464, 308), (436, 308)], hexc('#3B2A1E', 255), wobble=0.1, blur=0.1)
    c.wash([(450, 298), (450, 262), (472, 298)], hexc('#F7F2E8', 255), wobble=0.1, blur=0.1)
    # Cadre de fenêtre bleu breton, croisillons.
    for k, pts in enumerate([frame]):
        c.ink(pts, width=14, closed=True, color=hexc('#2F5C99', 255), jitter=0.2)
    c.ink([(512, wy0), (512, wy1)], width=9, color=hexc('#2F5C99', 255), jitter=0.2)
    c.ink([(wx0, 250), (wx1, 250)], width=9, color=hexc('#2F5C99', 255), jitter=0.2)
    c.ink([(wx0 - 20, wy1 + 12), (wx1 + 20, wy1 + 12)], width=12, color=hexc('#E9DDC6', 255))
    c.ink([(wx0 - 20, wy1 + 18), (wx1 + 20, wy1 + 18)], width=2)
    # Rideaux bonne-femme.
    for side in (-1, 1):
        x = wx0 - 10 if side < 0 else wx1 + 10
        cur = [(x, wy0 - 20), (x - side * 80, wy0 - 20), (x - side * 40, 250), (x - side * 30, wy1), (x, wy1)]
        c.wash(cur, hexc('#FBF6EC', 230), wobble=1, blur=0.5)
        c.ink(cur, width=1.4, closed=True, color=INK + (160,))
        for k in range(6):
            yy = wy0 + k * 60
            c.ink([(x - side * 10, yy), (x - side * 20, yy + 50)], width=0.8, color=INK + (70,))
    c.ink([(wx0 - 60, wy0 - 20), (wx1 + 60, wy0 - 20)], width=4)
    quimper(c, 150, 250, 70)
    quimper(c, 874, 250, 70)
    # Table et nappe vichy.
    table = [(-20, 600), (1044, 600), (1044, 1040), (-20, 1040)]
    c.wash(table, hexc('#F3EBDB', 255), wobble=0, blur=0, edge=False)
    blue = hexc('#6C8FC7', 110)
    for k in range(-12, 40):
        x0 = 512 + (k - 14) * 36
        x1 = 512 + (k - 14) * 70
        c.wash([(x0, 600), (x0 + 18, 600), (x1 + 35, 1040), (x1, 1040)], blue, wobble=0, blur=0.2, edge=False)
    y, h = 600, 12
    while y < 1040:
        c.wash([(-20, y), (1044, y), (1044, y + h / 2), (-20, y + h / 2)], blue, wobble=0, blur=0.2, edge=False)
        y += h
        h *= 1.12
    c.ink([(-20, 600), (1044, 600)], width=2)
    # Ombres portées.
    c.wash(c.ellipse_pts(530, 792, 250, 70, 50), hexc('#5A4632', 90), wobble=0, blur=8, edge=False)
    # Assiette.
    plate = c.ellipse_pts(512, 770, 250, 110, 60)
    c.wash(plate, hexc('#FBF6EC', 255), wobble=0.3, blur=0.2)
    c.ink(plate, width=2, closed=True)
    c.ink(c.ellipse_pts(512, 770, 200, 84, 60), width=1.4, color=hexc('#2F5C99', 200), closed=True)
    kouign(c, 512, 742, 170)
    # Bouteille de cidre à gauche.
    bx, bb = 170, 800
    bottle = [(bx - 40, bb), (bx - 40, bb - 190), (bx - 16, bb - 240), (bx - 14, bb - 300), (bx + 14, bb - 300), (bx + 16, bb - 240), (bx + 40, bb - 190), (bx + 40, bb)]
    c.wash([(x + 20, y + 14) for x, y in bottle], hexc('#5A4632', 70), wobble=0, blur=8, edge=False)
    c.wash(bottle, hexc('#4F6B2E', 235), wobble=0.4, blur=0.3)
    c.wash([(bx - 30, bb - 20), (bx - 30, bb - 180), (bx - 20, bb - 190), (bx - 20, bb - 20)], hexc('#C9D8A0', 150), wobble=0.3, blur=1.2, edge=False)
    label = [(bx - 38, bb - 150), (bx + 38, bb - 150), (bx + 38, bb - 80), (bx - 38, bb - 80)]
    c.wash(label, hexc('#F3EBDB', 255), wobble=0.3, blur=0.1)
    c.ink(label, width=1.4, closed=True)
    apple = [(bx + 18 * math.cos(a) * (1 - 0.12 * math.cos(a - math.pi / 2) ** 8), bb - 112 + 16 * math.sin(a) - 5 * max(0, -math.sin(a)) * math.cos(a * 2) ** 2) for a in [i / 30 * 2 * math.pi for i in range(31)]]
    c.wash(apple, hexc('#B3321F', 245), wobble=0.3, blur=0.2, edge=False)
    c.ink(apple, width=1.2, closed=True)
    c.ink([(bx, bb - 126), (bx + 3, bb - 138)], width=2, color=hexc('#5A3A1E', 255))
    c.wash([(bx + 3, bb - 134), (bx + 16, bb - 142), (bx + 8, bb - 130)], hexc('#2E6030', 250), wobble=0.2, blur=0.1, edge=False)
    c.ink([(bx - 28, bb - 88), (bx + 28, bb - 88)], width=1.2, color=hexc('#34466E', 200))
    c.ink(bottle, width=2, closed=True)
    c.wash([(bx - 15, bb - 300), (bx + 15, bb - 300), (bx + 15, bb - 318), (bx - 15, bb - 318)], hexc('#8B6A44', 255), wobble=0.2, blur=0.1)
    c.ink([(bx - 15, bb - 300), (bx + 15, bb - 300), (bx + 15, bb - 318), (bx - 15, bb - 318)], width=1.4, closed=True)
    # Motte de beurre à droite, dans son papier.
    mx, my = 860, 820
    paper = [(mx - 110, my + 10), (mx - 60, my - 70), (mx + 110, my - 60), (mx + 80, my + 30)]
    c.wash(paper, hexc('#FBF6EC', 250), wobble=1.5, blur=0.3)
    c.ink(paper, width=1.4, closed=True, color=INK + (170,))
    butter_top = [(mx - 60, my - 40), (mx + 50, my - 40), (mx + 70, my - 20), (mx - 40, my - 20)]
    butter_front = [(mx - 40, my - 20), (mx + 70, my - 20), (mx + 70, my + 20), (mx - 40, my + 20)]
    butter_side = [(mx - 60, my - 40), (mx - 40, my - 20), (mx - 40, my + 20), (mx - 60, my)]
    c.wash(butter_front, hexc('#F2D878', 255), wobble=0.4, blur=0.2)
    c.wash(butter_side, hexc('#D8B84E', 255), wobble=0.4, blur=0.2)
    c.wash(butter_top, hexc('#FBEBA6', 255), wobble=0.4, blur=0.2)
    for p in (butter_front, butter_side, butter_top):
        c.ink(p, width=1.6, closed=True)
    # Rouleau à pâtisserie au premier plan.
    rp = [(260, 990), (720, 930), (726, 966), (266, 1026)]
    c.wash(rp, hexc('#C8955A', 255), wobble=0.4, blur=0.2)
    c.hatch(rp, spacing=6, angle=-8, alpha=70)
    c.ink(rp, width=2, closed=True)
    for hx0, hy0, dx in [(200, 1012, -1), (786, 942, 1)]:
        hp = [(hx0, hy0 - 10), (hx0 + dx * 62, hy0 - 18) if dx > 0 else (hx0 + 60, hy0 - 18), (hx0 + 62, hy0 + 8) if dx < 0 else (hx0, hy0 + 16), (hx0, hy0 + 16)]
    for pts in ([(196, 1004), (262, 996), (266, 1024), (200, 1032)], [(722, 934), (790, 926), (794, 952), (726, 962)]):
        c.wash(pts, hexc('#A87444', 255), wobble=0.3, blur=0.2)
        c.ink(pts, width=1.6, closed=True)
    # Farine renversée.
    c.dots(220, (620, 880, 1000, 1010), hexc('#FFFFFF', 190), 0.8, 2.4)
    c.finish(f'{OUT}/cuisine-couverture.png', vignette=0.24)


if __name__ == '__main__':
    cover()
