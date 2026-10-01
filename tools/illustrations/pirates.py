import math
import sys

from kit import INK, Canvas, hexc

OUT = sys.argv[1] if len(sys.argv) > 1 else 'out'


def wave_band(c, y, amp, length, color, depth=60, phase=0.0):
    pts = []
    x = -20
    while x <= c.w + 20:
        pts.append((x, y + math.sin(x / length * 2 * math.pi + phase) * amp))
        x += 8
    c.wash(pts + [(c.w + 20, y + depth), (-20, y + depth)], color, wobble=1.5, blur=0.8)
    c.ink(pts, width=1.6, color=INK + (170,), jitter=0.4)


def ship(c, cx, base, s=1.0, sail=hexc('#2A2622', 250)):
    """Trois-mâts vu de trois quarts, voiles noires."""
    X = lambda v: cx + v * s
    Y = lambda v: base + v * s
    hull = [(X(-150), Y(-40)), (X(160), Y(-48)), (X(185), Y(-80)), (X(130), Y(10)), (X(-120), Y(12)), (X(-170), Y(-60))]
    c.wash(hull, hexc('#3B2A1E', 250), wobble=1, blur=0.5)
    c.hatch(hull, spacing=5, angle=-20, alpha=110)
    c.ink(hull, width=2.2, closed=True)
    for i in range(-3, 4):
        c.wash([(X(i * 34 - 6), Y(-26)), (X(i * 34 + 6), Y(-26)), (X(i * 34 + 6), Y(-18)), (X(i * 34 - 6), Y(-18))],
               hexc('#E8B45A', 230), wobble=0.5, blur=0.4, edge=False)
    masts = [(-95, 330), (20, 400), (130, 300)]
    for mx, mh in masts:
        c.ink([(X(mx), Y(-40)), (X(mx), Y(-40 - mh))], width=3.2)
        for k, (w, top, bot) in enumerate([(48, 0.95, 0.74), (66, 0.70, 0.46), (80, 0.41, 0.14)]):
            if top * mh < 60:
                continue
            ty, by = Y(-40 - mh * top), Y(-40 - mh * bot)
            bulge = 14 * s
            sail_pts = [(X(mx - w * 0.85), ty), (X(mx + w * 0.85), ty)]
            sail_pts += [(X(mx + w) + bulge * 0.6, (ty + by) / 2), (X(mx + w), by)]
            sail_pts += [(X(mx), by + bulge), (X(mx - w), by), (X(mx - w) + bulge * 0.3, (ty + by) / 2)]
            c.wash(sail_pts, sail, wobble=1.2, blur=0.4)
            hl = [(X(mx + w * 0.35), ty + 3), (X(mx + w * 0.82), ty + 3), (X(mx + w) + bulge * 0.5, (ty + by) / 2), (X(mx + w * 0.95), by - 3), (X(mx + w * 0.4), by + bulge * 0.7)]
            c.wash(hl, hexc('#5E6B78', 150), wobble=1, blur=2, edge=False)
            c.hatch(sail_pts, spacing=7, angle=80, alpha=60)
            c.ink(sail_pts, width=1.4, closed=True, color=(12, 10, 8, 255))
            c.ink([(X(mx - w * 0.9), ty), (X(mx + w * 0.9), ty)], width=2.2)
    # Cordages.
    c.ink([(X(-170), Y(-60)), (X(-95), Y(-370))], width=1.0, color=INK + (200,))
    c.ink([(X(185), Y(-80)), (X(130), Y(-340))], width=1.0, color=INK + (200,))
    c.ink([(X(-95), Y(-370)), (X(20), Y(-440)), (X(130), Y(-340))], width=1.0, color=INK + (200,))
    c.ink([(X(185), Y(-80)), (X(250), Y(-120))], width=2.4)
    # Pavillon au corbeau.
    fx, fy = X(20), Y(-440)
    flag = [(fx, fy), (fx + 70 * s, fy + 6 * s), (fx + 64 * s, fy + 22 * s), (fx + 72 * s, fy + 40 * s), (fx, fy + 42 * s)]
    c.wash(flag, hexc('#14110E', 255), wobble=0.6, blur=0.3, edge=False)
    bx, by = fx + 34 * s, fy + 21 * s
    bird = [(bx - 18 * s, by + 4 * s), (bx - 4 * s, by - 8 * s), (bx + 4 * s, by - 2 * s), (bx + 18 * s, by - 10 * s),
            (bx + 10 * s, by + 6 * s), (bx - 4 * s, by + 8 * s)]
    c.wash(bird, hexc('#F3EBDB', 240), wobble=0.3, blur=0.2, edge=False)


def tentacle(c, pts_center, r0, r1, color, sucker=hexc('#E9B7A6', 230)):
    """Tentacule : une épaisseur qui s'amincit le long d'une courbe, avec ventouses."""
    n = len(pts_center)
    left, right = [], []
    for i in range(n):
        x, y = pts_center[i]
        x2, y2 = pts_center[min(n - 1, i + 1)]
        x1, y1 = pts_center[max(0, i - 1)]
        dx, dy = x2 - x1, y2 - y1
        L = math.hypot(dx, dy) or 1
        nx, ny = -dy / L, dx / L
        r = r0 + (r1 - r0) * (i / (n - 1))
        left.append((x + nx * r, y + ny * r))
        right.append((x - nx * r, y - ny * r))
    shape = left + right[::-1]
    c.wash(shape, color, wobble=1, blur=0.6)
    mid = [((l[0] + r[0]) / 2, (l[1] + r[1]) / 2) for l, r in zip(left, right)]
    c.hatch(left + mid[::-1], spacing=5, angle=60, alpha=120)
    c.wash(right[:: -1][: n] and [((m[0] * 2 + r[0]) / 3 + 3, (m[1] * 2 + r[1]) / 3) for m, r in zip(mid, right)] + right[::-1], hexc('#D97A5E', 120), wobble=0.5, blur=2, edge=False)
    c.ink(shape, width=2.4, closed=True)
    for i in range(2, n - 2, 2):
        x, y = right[i]
        cx, cy = pts_center[i]
        mx, my = (x * 2 + cx) / 3, (y * 2 + cy) / 3
        r = (r0 + (r1 - r0) * (i / (n - 1))) * 0.32
        c.wash(c.ellipse_pts(mx, my, r, r, 20), sucker, wobble=0.3, blur=0.3, edge=False)
        c.ink(c.ellipse_pts(mx, my, r, r, 20), width=1.2, color=INK + (200,))


def spiral(cx, cy, r0, turns, a0, n=60, grow=1.0):
    pts = []
    for i in range(n + 1):
        t = i / n
        a = a0 + turns * 2 * math.pi * t
        r = r0 * (1 - t * 0.85 * grow)
        pts.append((cx + math.cos(a) * r, cy + math.sin(a) * r))
    return pts


def cover():
    c = Canvas(1024, 1024, seed=21)
    c.vgrad(hexc('#1E2A44'), hexc('#4A6A7A'), 0, 680)
    c.dots(140, (0, 0, 1024, 480), hexc('#F3EBDB', 200), 0.6, 1.8)
    c.glow(760, 250, 200, hexc('#F6E3B0', 140))
    c.wash(c.ellipse_pts(760, 250, 78, 78), hexc('#F6E6BE', 255), wobble=0.6, blur=0.5)
    c.wash(c.ellipse_pts(740, 236, 18, 14), hexc('#E2CC98', 200), wobble=0.4, blur=1, edge=False)
    c.wash(c.ellipse_pts(785, 276, 12, 10), hexc('#E2CC98', 180), wobble=0.4, blur=1, edge=False)
    # Nuages sombres qui passent devant la lune.
    c.cloud(820, 330, 340, 46, hexc('#28324C', 235))
    c.cloud(170, 190, 360, 40, hexc('#26304A', 200))
    c.cloud(560, 150, 200, 26, hexc('#2C3753', 170))
    # Reflet de lune.
    c.vgrad(hexc('#2F4B5C'), hexc('#1A2533'), 650, 1024)
    ship(c, 480, 690, s=0.95)
    for i, (y, a, l, col) in enumerate([(672, 7, 140, '#2B4556'), (725, 11, 170, '#243B4B'), (795, 15, 210, '#1D3040'), (890, 22, 260, '#15222F')]):
        wave_band(c, y, a, l, hexc(col, 235), depth=400, phase=i * 1.7)
    for k in range(10):
        y = 668 + k * 22 + k * k * 1.1
        w = (56 - k * 3) * c.rng.uniform(0.5, 1.1)
        cx = 760 + c.rng.uniform(-18, 18)
        c.wash([(cx - w, y), (cx + w, y - 2), (cx + w * 0.7, y + 4), (cx - w * 0.8, y + 4)], hexc('#F3E2B4', 140 - k * 10), wobble=2, blur=2.2, edge=False)
    # Tentacule qui surgit au premier plan.
    path = [(150 + 70 * math.sin(t * 2.4), 1080 - t * 500) for t in [i / 18 for i in range(19)]]
    path += spiral(path[-1][0] + 52, path[-1][1] - 6, 58, 1.05, math.pi, n=18)[1:]
    tentacle(c, path, 66, 8, hexc('#9A3F30', 250))
    # Écume.
    for x in range(0, 1024, 36):
        c.ink([(x, 900 + 10 * math.sin(x / 40)), (x + 14, 896 + 10 * math.sin(x / 40))], width=1.4, color=hexc('#F3EBDB', 150))
    c.finish(f'{OUT}/pirates-couverture.png')


if __name__ == '__main__':
    cover()
