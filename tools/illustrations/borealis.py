import math
import sys

from PIL import ImageChops, ImageDraw, ImageFilter

from kit import INK, SS, Canvas, hexc

OUT = sys.argv[1] if len(sys.argv) > 1 else 'out'


def aurora(c, base_pts, height, color, alpha=150):
    """Voile d'aurore : bord inférieur lumineux, stries verticales qui s'effacent vers le haut."""
    lay = c.layer()
    d = ImageDraw.Draw(lay)
    step = 3
    n_pts = len(base_pts)
    for i, (x, y) in enumerate(base_pts):
        h = height * (0.55 + 0.45 * c.rng.random())
        # Les bords du voile s'estompent au lieu de s'arrêter net.
        edge = min(1.0, i / (n_pts * 0.15), (n_pts - 1 - i) / (n_pts * 0.15))
        a0 = alpha * (0.5 + 0.5 * c.rng.random()) * edge
        n = 24
        for k in range(n):
            t = k / n
            a = int(a0 * (1 - t) ** 1.8)
            d.line([(x * SS, (y - h * t) * SS), (x * SS, (y - h * (t + 1 / n)) * SS)], fill=color[:3] + (a,), width=int(step * SS))
        # Liseré plus vif en bas du voile.
        d.line([(x * SS, (y + 2) * SS), (x * SS, (y - 10) * SS)], fill=color[:3] + (min(255, int(a0 * 1.3)),), width=int(step * SS))
    lay = lay.filter(ImageFilter.GaussianBlur(2.2 * SS))
    c.paste(lay)


def curve(x0, x1, y0, amp, freq, phase, step=3):
    return [(x, y0 + amp * math.sin(x / freq + phase)) for x in range(int(x0), int(x1), step)]


def module(c, x, y, w, h, lights, color='#D9DDE0'):
    """Module de station : boîte arrondie sur pilotis, hublots allumés."""
    r = h * 0.35
    body = c.ellipse_pts(x + r, y + r, r, r, 12, math.pi, 1.5 * math.pi) + c.ellipse_pts(x + w - r, y + r, r, r, 12, 1.5 * math.pi, 2 * math.pi)
    body += [(x + w, y + h), (x, y + h)]
    c.wash(body, hexc(color, 255), wobble=0.6, blur=0.3)
    c.hatch([(x, y + h * 0.55), (x + w, y + h * 0.55), (x + w, y + h), (x, y + h)], spacing=5, angle=-30, alpha=90)
    c.wash([(x + 3, y + h * 0.18), (x + w - 3, y + h * 0.18), (x + w - 3, y + h * 0.3), (x + 3, y + h * 0.3)], hexc('#B3321F', 230), wobble=0.3, blur=0.2, edge=False)
    c.ink(body, width=2, closed=True)
    for lx in lights:
        wx = x + lx * w
        c.glow(wx, y + h * 0.55, 30, hexc('#FFD27A', 120))
        c.wash(c.ellipse_pts(wx, y + h * 0.55, 9, 9, 20), hexc('#FFE3A0', 255), wobble=0.2, blur=0.2, edge=False)
        c.ink(c.ellipse_pts(wx, y + h * 0.55, 9, 9, 20), width=1.4)
    for px in (x + 12, x + w - 12):
        c.ink([(px, y + h), (px, y + h + 26)], width=3)
        c.ink([(px - 8, y + h + 26), (px + 8, y + h + 26)], width=2)


def cover():
    c = Canvas(1024, 1024, seed=9)
    c.vgrad(hexc('#0B1222'), hexc('#1C3044'), 0, 700)
    c.dots(260, (0, 0, 1024, 600), hexc('#F3EBDB', 210), 0.5, 1.7)
    aurora(c, curve(-20, 1044, 300, 70, 170, 2.1), 220, hexc('#A184E6'), alpha=120)
    aurora(c, curve(-20, 1044, 440, 60, 140, 0.5), 300, hexc('#62DDA2'), alpha=160)
    aurora(c, curve(150, 950, 520, 26, 70, 1.0), 170, hexc('#8CF0C0'), alpha=120)
    # Montagnes au loin.
    far = [(-20, 710)] + [(x, 640 - 36 * abs(math.sin(x / 110 + 0.4)) - 22 * math.sin(x / 37) ** 2) for x in range(-20, 1050, 18)] + [(1044, 710)]
    c.wash(far, hexc('#2E4760', 252), wobble=1, blur=0.4)
    c.hatch(far, spacing=7, angle=-50, alpha=70)
    c.ink(far[1:-1], width=1.6, color=INK + (170,))
    # Banquise.
    c.vgrad(hexc('#D3E3EC'), hexc('#8EA8BD'), 690, 1024)
    c.glow(512, 720, 300, hexc('#62DDA2', 60))
    for k in range(9):
        y = 716 + k * 30 + k * k * 1.6
        c.ink(curve(-20, 1044, y, 5, 90 + k * 14, k, 12), width=1.1, color=hexc('#5E7F99', 110))
    # La station, bien centrée.
    module(c, 250, 610, 330, 120, [0.18, 0.39, 0.61, 0.82])
    module(c, 600, 640, 190, 90, [0.3, 0.7], color='#C8CED3')
    c.wash([(578, 664), (602, 664), (602, 690), (578, 690)], hexc('#9BA3AA', 255), wobble=0.2, blur=0.1)
    c.ink([(578, 664), (602, 664), (602, 690), (578, 690)], width=1.4, closed=True)
    ax = 330
    c.ink([(ax, 610), (ax, 400)], width=3)
    for k in range(7):
        y = 610 - k * 30
        c.ink([(ax - 9, y), (ax + 9, y - 15)], width=1.2)
        c.ink([(ax + 9, y), (ax - 9, y - 15)], width=1.2)
    c.glow(ax, 396, 26, hexc('#FF5A3C', 210))
    c.wash(c.ellipse_pts(ax, 396, 6, 6, 16), hexc('#FF8A6E', 255), wobble=0, blur=0, edge=False)
    dome = c.ellipse_pts(480, 610, 52, 60, 30, math.pi, 2 * math.pi)
    c.wash(dome, hexc('#EDEFF1', 255), wobble=0.3, blur=0.2)
    c.hatch(dome[: len(dome) // 2] + [(480, 610)], spacing=5, angle=70, alpha=90)
    c.ink(dome, width=2)
    c.ink([(428, 610), (532, 610)], width=2)
    # Ombre portée de la station.
    c.wash(c.ellipse_pts(520, 764, 330, 16, 40), hexc('#5E7F99', 120), wobble=0.5, blur=4, edge=False)
    # Traces de pas vers la station, et une silhouette avec sa lampe.
    for k in range(10):
        t = k / 9
        x = 760 + 170 * (1 - t) ** 1.2 + 16 * (k % 2)
        y = 1010 - 200 * t
        r = 9 - 4 * t
        c.wash(c.ellipse_pts(x, y, r, r * 0.5, 12), hexc('#6D88A0', 210), wobble=0.2, blur=0.3, edge=False)
    fx, fy = 770, 812
    s_ = 1.5
    beam = [(fx - 30, fy - 80), (fx - 330, fy - 200), (fx - 330, fy - 40)]
    lay = c.layer()
    ImageDraw.Draw(lay).polygon(c.P(beam), fill=hexc('#FFF1C4', 80))
    c.paste(lay.filter(ImageFilter.GaussianBlur(8 * SS)))
    c.wash(c.ellipse_pts(fx, fy + 2, 36, 7, 20), hexc('#5E7F99', 160), wobble=0.2, blur=2, edge=False)
    # Silhouette vue de dos : parka, capuche bordée de fourrure, sac à dos, lampe à la main.
    legs = [[(fx - 16, fy - 40), (fx - 4, fy - 40), (fx - 6, fy), (fx - 18, fy)], [(fx + 4, fy - 40), (fx + 16, fy - 40), (fx + 18, fy - 2), (fx + 6, fy - 2)]]
    for leg in legs:
        c.wash(leg, hexc('#2A2622', 255), wobble=0.2, blur=0.1)
        c.ink(leg, width=1.4, closed=True)
    parka = [(fx - 26, fy - 36), (fx - 24, fy - 100), (fx - 14, fy - 116), (fx + 14, fy - 116), (fx + 24, fy - 100), (fx + 26, fy - 36)]
    c.wash(parka, hexc('#B3321F', 255), wobble=0.4, blur=0.2)
    c.hatch([(fx + 4, fy - 36), (fx + 4, fy - 116), (fx + 14, fy - 116), (fx + 24, fy - 100), (fx + 26, fy - 36)], spacing=4, angle=80, alpha=130)
    c.ink(parka, width=2, closed=True)
    bag = [(fx - 16, fy - 50), (fx - 18, fy - 104), (fx + 18, fy - 104), (fx + 16, fy - 50)]
    c.wash(bag, hexc('#4A5B45', 255), wobble=0.3, blur=0.2)
    c.ink(bag, width=1.6, closed=True)
    c.ink([(fx - 16, fy - 80), (fx + 16, fy - 80)], width=1.2)
    hood = c.ellipse_pts(fx, fy - 128, 17, 19, 30)
    c.wash(hood, hexc('#A02C1B', 255), wobble=0.3, blur=0.2)
    c.ink(hood, width=2)
    c.ink(c.ellipse_pts(fx, fy - 128, 17, 19, 20, math.pi * 0.95, math.pi * 2.05), width=4, color=hexc('#E8E0D0', 255))
    c.ink([(fx - 24, fy - 96), (fx - 38, fy - 62)], width=5, color=hexc('#B3321F', 255))
    c.ink([(fx - 38, fy - 62), (fx - 40, fy - 50)], width=1.6)
    c.glow(fx - 40, fy - 44, 20, hexc('#FFF1C4', 230))
    c.wash(c.ellipse_pts(fx - 40, fy - 44, 7, 8, 12), hexc('#FFFBEA', 255), wobble=0, blur=0.3, edge=False)
    c.dots(120, (0, 380, 1024, 1024), hexc('#FFFFFF', 200), 0.8, 2.2)
    c.finish(f'{OUT}/borealis-couverture.png', vignette=0.3)


if __name__ == '__main__':
    cover()
