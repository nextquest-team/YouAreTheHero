"""Petite boîte à outils de dessin : aplats d'aquarelle, trait d'encre, hachures, grain de papier.

Tout est dessiné en 2x puis réduit, pour des bords lisses.
"""
import math
import random

from PIL import Image, ImageChops, ImageDraw, ImageFilter

SS = 2
PAPER = (243, 235, 219)
INK = (29, 26, 22)


def hexc(h, a=255):
    h = h.lstrip('#')
    return (int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16), a)


class Canvas:
    def __init__(self, w, h, seed=1):
        self.w, self.h = w, h
        self.W, self.H = w * SS, h * SS
        self.img = Image.new('RGBA', (self.W, self.H), PAPER + (255,))
        self.rng = random.Random(seed)

    # --- coordonnées en unités « finales », converties en 2x ---
    def P(self, pts):
        return [(x * SS, y * SS) for x, y in pts]

    def layer(self):
        return Image.new('RGBA', (self.W, self.H), (0, 0, 0, 0))

    def paste(self, lay):
        self.img = Image.alpha_composite(self.img, lay)

    def vgrad(self, top, bottom, y0=0, y1=None, mask=None):
        """Dégradé vertical, éventuellement limité par un masque."""
        y1 = self.h if y1 is None else y1
        lay = self.layer()
        d = ImageDraw.Draw(lay)
        a0, a1 = y0 * SS, y1 * SS
        for y in range(int(a0), int(a1)):
            t = (y - a0) / max(1, a1 - a0)
            c = tuple(int(top[i] + (bottom[i] - top[i]) * t) for i in range(4))
            d.line([(0, y), (self.W, y)], fill=c)
        if mask is not None:
            lay.putalpha(ImageChops.multiply(lay.getchannel('A'), mask))
        self.paste(lay)

    def mask_poly(self, pts):
        m = Image.new('L', (self.W, self.H), 0)
        ImageDraw.Draw(m).polygon(self.P(pts), fill=255)
        return m

    def wash(self, pts, color, wobble=2.5, blur=1.2, edge=True):
        """Aplat d'aquarelle : forme un peu tremblée, bord plus foncé, légère texture."""
        pts = self.jitter(pts, wobble)
        lay = self.layer()
        ImageDraw.Draw(lay).polygon(self.P(pts), fill=color)
        if blur:
            lay = lay.filter(ImageFilter.GaussianBlur(blur * SS))
        if edge:
            # Pigment qui s'accumule au bord de la flaque.
            a = lay.getchannel('A')
            inner = a.filter(ImageFilter.GaussianBlur(6 * SS))
            rim = ImageChops.subtract(a, inner).point(lambda v: min(255, v * 2))
            dark = tuple(max(0, int(c * 0.78)) for c in color[:3]) + (0,)
            rl = Image.new('RGBA', lay.size, dark)
            rl.putalpha(rim.point(lambda v: int(v * 0.55 * color[3] / 255)))
            lay = Image.alpha_composite(lay, rl)
        self.paste(lay)

    def ellipse_pts(self, cx, cy, rx, ry, n=64, a0=0, a1=2 * math.pi):
        return [(cx + rx * math.cos(a0 + (a1 - a0) * i / n), cy + ry * math.sin(a0 + (a1 - a0) * i / n)) for i in range(n + 1)]

    def jitter(self, pts, amount):
        if not amount:
            return pts
        return [(x + self.rng.uniform(-amount, amount) * 0.5, y + self.rng.uniform(-amount, amount) * 0.5) for x, y in pts]

    def ink(self, pts, width=2.0, color=INK, closed=False, jitter=0.6):
        """Trait d'encre à main levée : on redécoupe le tracé et on le fait trembler un peu."""
        if closed:
            pts = list(pts) + [pts[0]]
        dense = []
        for (x0, y0), (x1, y1) in zip(pts, pts[1:]):
            n = max(1, int(math.hypot(x1 - x0, y1 - y0) / 6))
            for i in range(n):
                t = i / n
                dense.append((x0 + (x1 - x0) * t, y0 + (y1 - y0) * t))
        dense.append(pts[-1])
        dense = self.jitter(dense, jitter)
        lay = self.layer()
        d = ImageDraw.Draw(lay)
        c = color if len(color) == 4 else color + (235,)
        d.line(self.P(dense), fill=c, width=max(1, int(width * SS)), joint='curve')
        self.paste(lay)

    def hatch(self, pts, spacing=6, angle=45, width=1.0, color=INK, alpha=150):
        """Hachures parallèles à l'intérieur d'un polygone."""
        m = self.mask_poly(pts)
        lay = self.layer()
        d = ImageDraw.Draw(lay)
        diag = int(math.hypot(self.W, self.H))
        rad = math.radians(angle)
        dx, dy = math.cos(rad), math.sin(rad)
        nx, ny = -dy, dx
        cx, cy = self.W / 2, self.H / 2
        s = spacing * SS
        k = -diag
        while k < diag:
            ox, oy = cx + nx * k, cy + ny * k
            j = self.rng.uniform(-0.8, 0.8) * SS
            d.line([(ox - dx * diag + j, oy - dy * diag), (ox + dx * diag + j, oy + dy * diag)],
                   fill=color[:3] + (alpha,), width=max(1, int(width * SS)))
            k += s
        lay.putalpha(ImageChops.multiply(lay.getchannel('A'), m))
        self.paste(lay)

    def glow(self, cx, cy, r, color, strength=1.0):
        lay = self.layer()
        ImageDraw.Draw(lay).ellipse([(cx - r) * SS, (cy - r) * SS, (cx + r) * SS, (cy + r) * SS], fill=color)
        lay = lay.filter(ImageFilter.GaussianBlur(r * SS * 0.45))
        if strength != 1.0:
            lay.putalpha(lay.getchannel('A').point(lambda v: min(255, int(v * strength))))
        self.paste(lay)

    def cloud(self, cx, cy, w, h, color, puffs=7, soft=4):
        """Nuage fait de bulles irrégulières qui se chevauchent, bas aplati et bords doux."""
        lay = self.layer()
        d = ImageDraw.Draw(lay)
        for i in range(puffs * 2):
            t = self.rng.uniform(0, 1)
            x = cx - w / 2 + w * t
            r = h * (0.35 + 0.65 * math.sin(math.pi * t)) * self.rng.uniform(0.6, 1.2)
            y = cy - self.rng.uniform(0, h * 0.25)
            d.ellipse([(x - r * 1.4) * SS, (y - r) * SS, (x + r * 1.4) * SS, (y + r * 0.3) * SS], fill=color)
        lay = lay.filter(ImageFilter.GaussianBlur(soft * SS))
        self.paste(lay)

    def dots(self, n, box, color, rmin=0.6, rmax=1.6):
        x0, y0, x1, y1 = box
        lay = self.layer()
        d = ImageDraw.Draw(lay)
        for _ in range(n):
            x, y = self.rng.uniform(x0, x1), self.rng.uniform(y0, y1)
            r = self.rng.uniform(rmin, rmax)
            d.ellipse([(x - r) * SS, (y - r) * SS, (x + r) * SS, (y + r) * SS], fill=color)
        self.paste(lay)

    def finish(self, path, vignette=0.28, grain=10):
        img = self.img.convert('RGB').resize((self.w, self.h), Image.LANCZOS)
        rng = random.Random(7)
        # Grain de papier.
        noise = Image.effect_noise((self.w, self.h), 40).convert('L')
        noise = noise.filter(ImageFilter.GaussianBlur(0.6))
        g = noise.point(lambda v: 128 + (v - 128) * grain // 40)
        img = ImageChops.overlay(img, Image.merge('RGB', (g, g, g)))
        # Fibres du papier : taches très diffuses.
        fib = Image.new('L', (self.w, self.h), 128)
        fd = ImageDraw.Draw(fib)
        for _ in range(60):
            x, y = rng.uniform(0, self.w), rng.uniform(0, self.h)
            r = rng.uniform(20, 90)
            fd.ellipse([x - r, y - r, x + r, y + r], fill=rng.choice([118, 136]))
        fib = fib.filter(ImageFilter.GaussianBlur(30))
        img = ImageChops.overlay(img, Image.merge('RGB', (fib, fib, fib)))
        # Vignettage façon vieille gravure.
        if vignette:
            v = Image.new('L', (self.w, self.h), 0)
            ImageDraw.Draw(v).ellipse([-self.w * 0.15, -self.h * 0.15, self.w * 1.15, self.h * 1.15], fill=255)
            v = v.filter(ImageFilter.GaussianBlur(min(self.w, self.h) * 0.12))
            dark = Image.new('RGB', (self.w, self.h), (60, 45, 30))
            img = Image.composite(img, Image.blend(img, dark, vignette), v)
        img.save(path, optimize=True)
        return img
