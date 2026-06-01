#!/usr/bin/env python3
"""Generate rough Bridge Area runtime PNG placeholders.

These are intentionally replaceable Digital Sketchbook placeholders: off-white
paper, black ink, strong silhouettes, and layered Phaser-friendly exports.
"""

from __future__ import annotations

import json
import math
import random
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public" / "assets" / "ridge" / "bridge"
SCALE = 3
WORLD_WIDTH = 2600
WORLD_HEIGHT = 600
FLOOR_Y = 500

INK = (26, 26, 26, 255)
INK_SOFT = (26, 26, 26, 170)
INK_FAINT = (26, 26, 26, 70)
PAPER = (247, 241, 223, 255)
PAPER_WARM = (242, 235, 213, 245)
PAPER_LIGHT = (251, 250, 245, 235)
TRANSPARENT = (0, 0, 0, 0)


def scaled(value: float) -> int:
    return int(round(value * SCALE))


def xy(point: tuple[float, float]) -> tuple[int, int]:
    return (scaled(point[0]), scaled(point[1]))


def rgba(color: tuple[int, int, int, int], alpha: int) -> tuple[int, int, int, int]:
    return (color[0], color[1], color[2], alpha)


def new_canvas(width: int, height: int, fill: tuple[int, int, int, int] = TRANSPARENT):
    image = Image.new("RGBA", (width * SCALE, height * SCALE), fill)
    return image, ImageDraw.Draw(image)


def save_canvas(image: Image.Image, width: int, height: int, path: Path) -> None:
    image = image.resize((width, height), Image.Resampling.LANCZOS)
    image.save(path)


def jittered(points: list[tuple[float, float]], jitter: float) -> list[tuple[int, int]]:
    return [
        xy((x + random.uniform(-jitter, jitter), y + random.uniform(-jitter, jitter)))
        for x, y in points
    ]


def draw_line(
    draw: ImageDraw.ImageDraw,
    points: list[tuple[float, float]],
    *,
    fill: tuple[int, int, int, int] = INK,
    width: int = 4,
    jitter: float = 0.5,
    passes: int = 2,
    closed: bool = False,
) -> None:
    source = points + ([points[0]] if closed else [])
    for _ in range(passes):
        draw.line(
            jittered(source, jitter),
            fill=fill,
            width=max(1, scaled(width + random.uniform(-0.4, 0.4))),
            joint="curve",
        )


def draw_poly(
    draw: ImageDraw.ImageDraw,
    points: list[tuple[float, float]],
    *,
    fill: tuple[int, int, int, int],
    outline: tuple[int, int, int, int] = INK,
    width: int = 4,
    jitter: float = 0.6,
) -> None:
    poly = jittered(points, jitter)
    draw.polygon(poly, fill=fill)
    draw.line(poly + [poly[0]], fill=outline, width=scaled(width), joint="curve")


def torn_rect_points(
    x: float,
    y: float,
    width: float,
    height: float,
    *,
    teeth: int = 8,
    roughness: float = 5,
) -> list[tuple[float, float]]:
    points: list[tuple[float, float]] = []
    for i in range(teeth + 1):
        px = x + width * i / teeth
        points.append((px, y + random.uniform(-roughness, roughness)))
    for i in range(1, teeth + 1):
        py = y + height * i / teeth
        points.append((x + width + random.uniform(-roughness, roughness), py))
    for i in range(teeth, -1, -1):
        px = x + width * i / teeth
        points.append((px, y + height + random.uniform(-roughness, roughness)))
    for i in range(teeth, 0, -1):
        py = y + height * i / teeth
        points.append((x + random.uniform(-roughness, roughness), py))
    return points


def draw_torn_rect(
    draw: ImageDraw.ImageDraw,
    x: float,
    y: float,
    width: float,
    height: float,
    *,
    fill: tuple[int, int, int, int] = PAPER,
    outline: tuple[int, int, int, int] = INK,
    line_width: int = 4,
    roughness: float = 5,
) -> None:
    draw_poly(
        draw,
        torn_rect_points(x, y, width, height, roughness=roughness),
        fill=fill,
        outline=outline,
        width=line_width,
        jitter=0.3,
    )


def draw_hatching(
    draw: ImageDraw.ImageDraw,
    x: float,
    y: float,
    width: float,
    height: float,
    *,
    spacing: float = 18,
    fill: tuple[int, int, int, int] = INK_FAINT,
    line_width: int = 2,
) -> None:
    offset = -height
    while offset < width + height:
        draw.line(
            [xy((x + offset, y + height)), xy((x + offset + height, y))],
            fill=fill,
            width=scaled(line_width),
        )
        offset += spacing


def draw_tape(
    draw: ImageDraw.ImageDraw,
    x: float,
    y: float,
    width: float,
    height: float,
    *,
    angle: float = 0,
) -> None:
    cx = x + width / 2
    cy = y + height / 2
    points = [
        (-width / 2, -height / 2),
        (width / 2, -height / 2),
        (width / 2, height / 2),
        (-width / 2, height / 2),
    ]
    cos_a = math.cos(math.radians(angle))
    sin_a = math.sin(math.radians(angle))
    rotated = [
        (
            cx + px * cos_a - py * sin_a,
            cy + px * sin_a + py * cos_a,
        )
        for px, py in points
    ]
    draw_poly(draw, rotated, fill=rgba(PAPER_LIGHT, 180), outline=rgba(INK, 80), width=2, jitter=0.2)
    draw_line(draw, [(cx - width * 0.28, cy), (cx + width * 0.28, cy)], fill=rgba(INK, 60), width=1, passes=1)


def add_paper_noise(image: Image.Image, opacity: int = 18) -> Image.Image:
    rng = random.Random(914)
    noise = Image.new("RGBA", image.size, TRANSPARENT)
    pixels = noise.load()
    for y in range(0, image.size[1], 3):
        for x in range(0, image.size[0], 3):
            value = rng.randint(0, opacity)
            pixels[x, y] = (26, 26, 26, value)
    return Image.alpha_composite(image, noise.filter(ImageFilter.GaussianBlur(radius=0.35 * SCALE)))


def create_backdrop() -> None:
    width, height = WORLD_WIDTH, WORLD_HEIGHT
    image, draw = new_canvas(width, height)

    for y in range(108, height, 94):
        draw_line(draw, [(0, y), (width, y + random.uniform(-5, 5))], fill=rgba(INK, 34), width=2, jitter=0.2, passes=1)

    draw_line(
        draw,
        [(0, 450), (260, 432), (540, 444), (820, 425), (1120, 440), (1420, 426), (1740, 446), (2060, 428), (2360, 442), (2600, 432)],
        fill=rgba(INK, 46),
        width=4,
        jitter=2,
        passes=1,
    )
    draw_line(
        draw,
        [(1780, 368), (1920, 310), (2050, 376), (2180, 322), (2320, 370)],
        fill=rgba(INK, 38),
        width=3,
        jitter=1.2,
        passes=1,
    )

    for x in [420, 860, 1710, 2240]:
        draw_torn_rect(draw, x, 158 + random.uniform(-20, 20), 150, 44, fill=rgba(PAPER_LIGHT, 80), outline=rgba(INK, 42), line_width=2, roughness=4)
        draw_tape(draw, x + 20, 150, 44, 18, angle=-8)

    image = add_paper_noise(image, opacity=12)
    save_canvas(image, width, height, OUT / "bridge-stage-backdrop.png")


def draw_pine(
    draw: ImageDraw.ImageDraw,
    x: float,
    base_y: float,
    height: float,
    *,
    fill: tuple[int, int, int, int],
    outline: tuple[int, int, int, int],
    width: int,
) -> None:
    trunk_top = base_y - height * 0.58
    draw_line(draw, [(x, base_y), (x + random.uniform(-4, 4), trunk_top)], fill=outline, width=max(1, width - 1), jitter=0.8, passes=1)
    levels = [
        (base_y - height * 0.16, height * 0.28),
        (base_y - height * 0.36, height * 0.24),
        (base_y - height * 0.55, height * 0.2),
    ]
    for y, tier_height in levels:
        tier_width = height * (0.24 + (base_y - y) / height * 0.16)
        draw_poly(
            draw,
            [(x, y - tier_height), (x - tier_width, y + tier_height * 0.34), (x + tier_width, y + tier_height * 0.34)],
            fill=fill,
            outline=outline,
            width=width,
            jitter=1.5,
        )


def create_forest_layer(filename: str, *, alpha: int, y_offset: float, scale: float, spacing: int) -> None:
    width, height = WORLD_WIDTH, WORLD_HEIGHT
    image, draw = new_canvas(width, height)

    x = -80
    while x < width + 160:
        tree_height = random.uniform(120, 215) * scale
        base_y = FLOOR_Y + y_offset + random.uniform(-16, 18)
        draw_pine(
            draw,
            x + random.uniform(-28, 28),
            base_y,
            tree_height,
            fill=rgba(PAPER_LIGHT, max(70, alpha - 18)),
            outline=rgba(INK, alpha),
            width=2 if alpha < 80 else 3,
        )
        x += random.randint(spacing - 26, spacing + 34)

    image = add_paper_noise(image, opacity=8)
    save_canvas(image, width, height, OUT / filename)


def create_foreground_screen() -> None:
    width, height = 320, 240
    image, draw = new_canvas(width, height)

    draw_pine(draw, 70, 224, 190, fill=rgba(PAPER_WARM, 238), outline=rgba(INK, 184), width=4)
    draw_pine(draw, 156, 226, 220, fill=rgba(PAPER_LIGHT, 240), outline=rgba(INK, 190), width=4)
    draw_pine(draw, 242, 226, 178, fill=rgba(PAPER_WARM, 238), outline=rgba(INK, 165), width=4)
    draw_hatching(draw, 36, 82, 226, 122, spacing=15, fill=rgba(INK, 34), line_width=1)
    draw_torn_rect(draw, 28, 212, 250, 28, fill=rgba(PAPER_LIGHT, 225), outline=rgba(INK, 116), line_width=3, roughness=5)
    draw_tape(draw, 92, 112, 58, 18, angle=-10)
    draw_tape(draw, 180, 130, 62, 18, angle=8)
    image = add_paper_noise(image, opacity=14)
    save_canvas(image, width, height, OUT / "bridge-stage-foreground-screen.png")


def create_ground() -> None:
    width, height = WORLD_WIDTH, WORLD_HEIGHT
    image, draw = new_canvas(width, height)

    left_top = [(0, FLOOR_Y - 2), (180, FLOOR_Y - 16), (420, FLOOR_Y - 5), (710, FLOOR_Y - 20), (980, FLOOR_Y - 6), (1220, FLOOR_Y - 18), (1450, FLOOR_Y - 8)]
    right_top = [(1730, FLOOR_Y - 8), (1920, FLOOR_Y - 16), (2140, FLOOR_Y - 5), (2360, FLOOR_Y - 14), (2600, FLOOR_Y - 4)]
    draw_poly(draw, left_top + [(1450, 568), (0, 568)], fill=PAPER_WARM, outline=INK_SOFT, width=5, jitter=1.2)
    draw_poly(draw, right_top + [(2600, 568), (1730, 568)], fill=PAPER_WARM, outline=INK_SOFT, width=5, jitter=1.2)
    draw_hatching(draw, 28, FLOOR_Y + 14, 1340, 38, spacing=18, fill=rgba(INK, 45), line_width=2)
    draw_hatching(draw, 1770, FLOOR_Y + 14, 760, 38, spacing=18, fill=rgba(INK, 45), line_width=2)

    for x in [112, 310, 610, 905, 1260, 1850, 2100, 2360]:
        draw_line(draw, [(x - 34, FLOOR_Y + 54), (x + 34, FLOOR_Y + 48)], fill=rgba(INK, 54), width=2, jitter=2, passes=1)
    image = add_paper_noise(image, opacity=10)
    save_canvas(image, width, height, OUT / "bridge-ground-strips.png")


def create_bridge_state(filename: str, completed: bool) -> None:
    width, height = 460, 210
    image, draw = new_canvas(width, height)
    deck_y = 132

    draw_torn_rect(draw, 28, 82, 70, 118, fill=PAPER_WARM, outline=INK_SOFT, line_width=5, roughness=5)
    draw_torn_rect(draw, 362, 82, 70, 118, fill=PAPER_WARM, outline=INK_SOFT, line_width=5, roughness=5)
    draw_hatching(draw, 42, 96, 46, 84, spacing=12, fill=rgba(INK, 42), line_width=1)
    draw_hatching(draw, 374, 96, 46, 84, spacing=12, fill=rgba(INK, 42), line_width=1)

    if completed:
        draw_torn_rect(draw, 78, deck_y - 18, 304, 36, fill=rgba(PAPER_LIGHT, 250), outline=INK, line_width=6, roughness=5)
        draw_line(draw, [(92, deck_y - 36), (368, deck_y - 36)], fill=rgba(INK, 145), width=3, jitter=1, passes=2)
        draw_line(draw, [(98, deck_y + 22), (360, deck_y + 22)], fill=rgba(INK, 86), width=2, jitter=1, passes=1)
        for x in range(112, 356, 42):
            draw_line(draw, [(x, deck_y - 16), (x + 10, deck_y + 14)], fill=rgba(INK, 70), width=2, jitter=0.5, passes=1)
        draw_tape(draw, 202, deck_y - 38, 68, 22, angle=4)
    else:
        draw_torn_rect(draw, 82, deck_y - 16, 92, 34, fill=rgba(PAPER_LIGHT, 205), outline=rgba(INK, 155), line_width=4, roughness=5)
        draw_torn_rect(draw, 286, deck_y - 16, 92, 34, fill=rgba(PAPER_LIGHT, 205), outline=rgba(INK, 155), line_width=4, roughness=5)
        draw_line(draw, [(190, deck_y - 26), (270, deck_y + 28)], fill=rgba(INK, 150), width=5, jitter=1, passes=2)
        draw_line(draw, [(270, deck_y - 26), (190, deck_y + 28)], fill=rgba(INK, 150), width=5, jitter=1, passes=2)
        draw_line(draw, [(182, deck_y + 32), (278, deck_y + 34)], fill=rgba(INK, 58), width=2, jitter=1.4, passes=1)

    image = add_paper_noise(image, opacity=12)
    save_canvas(image, width, height, OUT / filename)


def create_work_zone() -> None:
    width, height = 430, 230
    image, draw = new_canvas(width, height)

    draw_torn_rect(draw, 68, 34, 292, 128, fill=rgba(PAPER_LIGHT, 238), outline=rgba(INK, 126), line_width=4, roughness=6)
    draw_tape(draw, 84, 24, 62, 20, angle=-7)
    draw_tape(draw, 284, 28, 66, 20, angle=8)

    draw_torn_rect(draw, 116, 74, 200, 74, fill=rgba(PAPER, 255), outline=rgba(INK, 205), line_width=4, roughness=4)
    draw_line(draw, [(136, 118), (178, 96), (222, 122), (292, 100)], fill=rgba(INK, 170), width=4, jitter=1, passes=2)
    draw_line(draw, [(138, 136), (292, 136)], fill=rgba(INK, 56), width=2, jitter=0.5, passes=1)

    draw_torn_rect(draw, 94, 166, 250, 34, fill=PAPER_WARM, outline=rgba(INK, 170), line_width=4, roughness=4)
    draw_line(draw, [(132, 199), (116, 226)], fill=rgba(INK, 150), width=5, jitter=0.5, passes=1)
    draw_line(draw, [(310, 199), (330, 226)], fill=rgba(INK, 150), width=5, jitter=0.5, passes=1)
    draw_torn_rect(draw, 32, 176, 48, 24, fill=rgba(PAPER, 228), outline=rgba(INK, 70), line_width=2, roughness=4)

    image = add_paper_noise(image, opacity=14)
    save_canvas(image, width, height, OUT / "draftsperson-work-zone.png")


def create_rest_shelter() -> None:
    width, height = 290, 210
    image, draw = new_canvas(width, height)

    draw_poly(draw, [(34, 198), (116, 48), (258, 198)], fill=PAPER_WARM, outline=rgba(INK, 190), width=5, jitter=2.0)
    draw_poly(draw, [(116, 48), (152, 198), (258, 198)], fill=rgba(PAPER_LIGHT, 235), outline=rgba(INK, 116), width=3, jitter=1.3)
    draw_line(draw, [(116, 48), (152, 198)], fill=rgba(INK, 145), width=4, jitter=0.8, passes=2)
    draw_torn_rect(draw, 86, 150, 62, 48, fill=(26, 26, 26, 128), outline=rgba(INK, 155), line_width=3, roughness=4)
    draw_torn_rect(draw, 164, 168, 66, 24, fill=rgba(PAPER, 220), outline=rgba(INK, 90), line_width=2, roughness=3)
    draw_tape(draw, 78, 78, 54, 18, angle=-14)
    image = add_paper_noise(image, opacity=14)
    save_canvas(image, width, height, OUT / "draftsperson-rest-shelter.png")


def create_draftsperson_character() -> None:
    width, height = 128, 170
    image, draw = new_canvas(width, height)

    draw.ellipse([scaled(40), scaled(142), scaled(100), scaled(158)], fill=rgba(INK, 40))
    draw_poly(draw, [(44, 154), (50, 74), (82, 72), (92, 154)], fill=PAPER, outline=INK, width=5, jitter=1.0)
    draw_poly(draw, [(48, 82), (84, 82), (72, 106), (60, 106)], fill=rgba(INK, 42), outline=rgba(INK, 110), width=2, jitter=0.5)
    draw.ellipse([scaled(40), scaled(34), scaled(88), scaled(82)], fill=PAPER, outline=INK, width=scaled(5))
    draw_poly(draw, [(36, 42), (62, 24), (92, 42), (86, 50), (42, 50)], fill=PAPER_WARM, outline=INK, width=4, jitter=0.6)
    draw_line(draw, [(54, 58), (62, 57)], fill=INK, width=3, passes=1)
    draw_line(draw, [(74, 58), (82, 62)], fill=INK, width=3, passes=1)
    draw_line(draw, [(66, 72), (80, 72)], fill=rgba(INK, 150), width=2, passes=1)
    draw_line(draw, [(38, 92), (14, 116), (18, 140)], fill=INK_SOFT, width=5, jitter=1, passes=2)
    draw_line(draw, [(90, 90), (112, 112), (108, 138)], fill=INK_SOFT, width=5, jitter=1, passes=2)
    draw_torn_rect(draw, 6, 118, 36, 18, fill=rgba(PAPER_LIGHT, 245), outline=INK_SOFT, line_width=3, roughness=3)
    draw_line(draw, [(88, 32), (110, 20)], fill=INK_SOFT, width=3, jitter=0.3, passes=1)
    draw_line(draw, [(54, 154), (48, 168)], fill=INK_SOFT, width=5, passes=1)
    draw_line(draw, [(82, 154), (88, 168)], fill=INK_SOFT, width=5, passes=1)
    image = add_paper_noise(image, opacity=10)
    save_canvas(image, width, height, OUT / "draftsperson-character.png")


def create_toy_car() -> None:
    width, height = 96, 64
    image, draw = new_canvas(width, height)

    draw_torn_rect(draw, 18, 26, 56, 20, fill=PAPER_LIGHT, outline=INK, line_width=4, roughness=3)
    draw_torn_rect(draw, 28, 14, 28, 18, fill=PAPER, outline=INK_SOFT, line_width=3, roughness=2)
    draw.ellipse([scaled(24), scaled(41), scaled(38), scaled(55)], fill=INK)
    draw.ellipse([scaled(58), scaled(41), scaled(72), scaled(55)], fill=INK)
    draw.ellipse([scaled(28), scaled(45), scaled(34), scaled(51)], fill=PAPER)
    draw.ellipse([scaled(62), scaled(45), scaled(68), scaled(51)], fill=PAPER)
    draw_torn_rect(draw, 58, 18, 18, 12, fill=rgba(PAPER_WARM, 235), outline=rgba(INK, 110), line_width=2, roughness=2)
    draw_line(draw, [(14, 48), (78, 49)], fill=rgba(INK, 70), width=2, jitter=1, passes=1)
    image = add_paper_noise(image, opacity=8)
    save_canvas(image, width, height, OUT / "toy-car-prop.png")


def create_role_icons() -> None:
    cell = 96
    width, height = cell * 3, cell
    image, draw = new_canvas(width, height)

    for i in range(3):
        cx = i * cell + cell / 2
        draw.ellipse(
            [scaled(cx - 36), scaled(12), scaled(cx + 36), scaled(84)],
            fill=PAPER_LIGHT,
            outline=INK,
            width=scaled(4),
        )

    # Cicka
    draw.ellipse([scaled(18), scaled(46), scaled(68), scaled(70)], fill=INK)
    draw.polygon([xy((34, 46)), xy((42, 26)), xy((50, 46))], fill=INK)
    draw.polygon([xy((50, 46)), xy((62, 30)), xy((62, 52))], fill=INK)
    draw_line(draw, [(66, 58), (82, 46), (78, 34)], fill=INK, width=5, jitter=0.5, passes=1)

    # Draftsperson
    offset = 96
    draw.ellipse([scaled(offset + 32), scaled(28), scaled(offset + 70), scaled(66)], fill=PAPER, outline=INK, width=scaled(4))
    draw_poly(draw, [(offset + 28, 34), (offset + 52, 18), (offset + 76, 34)], fill=PAPER_WARM, outline=INK, width=3, jitter=0.4)
    draw_line(draw, [(offset + 50, 54), (offset + 64, 54)], fill=INK, width=2, passes=1)
    draw_torn_rect(draw, offset + 20, 64, 58, 14, fill=rgba(PAPER_LIGHT, 245), outline=INK_SOFT, line_width=2, roughness=2)

    # Prompt/narration
    offset = 192
    draw_torn_rect(draw, offset + 24, 24, 48, 46, fill=PAPER, outline=INK, line_width=4, roughness=4)
    draw_line(draw, [(offset + 34, 39), (offset + 62, 36)], fill=rgba(INK, 120), width=2, jitter=0.5, passes=1)
    draw_line(draw, [(offset + 34, 52), (offset + 58, 50)], fill=rgba(INK, 120), width=2, jitter=0.5, passes=1)
    draw_line(draw, [(offset + 66, 66), (offset + 80, 78)], fill=INK, width=5, jitter=0.4, passes=1)

    image = add_paper_noise(image, opacity=8)
    save_canvas(image, width, height, OUT / "bridge-role-icons.png")


def create_debug_contact() -> None:
    assets = [
        "bridge-stage-backdrop.png",
        "bridge-far-forest.png",
        "bridge-mid-forest.png",
        "bridge-stage-foreground-screen.png",
        "bridge-ground-strips.png",
        "bridge-crossing-before.png",
        "bridge-crossing-after.png",
        "draftsperson-work-zone.png",
        "draftsperson-rest-shelter.png",
        "draftsperson-character.png",
        "toy-car-prop.png",
        "bridge-role-icons.png",
    ]
    thumb_w, thumb_h = 240, 130
    label_h = 26
    cols = 2
    rows = math.ceil(len(assets) / cols)
    width = cols * thumb_w
    height = rows * (thumb_h + label_h)
    sheet = Image.new("RGBA", (width, height), (247, 241, 223, 255))
    draw = ImageDraw.Draw(sheet)
    for index, asset in enumerate(assets):
        src = Image.open(OUT / asset).convert("RGBA")
        src.thumbnail((thumb_w - 24, thumb_h - 16), Image.Resampling.LANCZOS)
        col = index % cols
        row = index // cols
        x = col * thumb_w + (thumb_w - src.width) // 2
        y = row * (thumb_h + label_h) + 8
        sheet.alpha_composite(src, (x, y))
        draw.text((col * thumb_w + 10, row * (thumb_h + label_h) + thumb_h + 2), asset, fill=(26, 26, 26, 210))
    sheet.save(OUT / "bridge-debug-contact.png")


def write_manifest() -> None:
    manifest = {
        "slug": "bridge-visual-coherence",
        "owner": "src/game/scenes/ridge/**",
        "generatedBy": "scripts/generate-bridge-assets.py",
        "style": "Digital Sketchbook: off-white paper, black ink, silhouette-first, hatching for value.",
        "assets": [
            {"key": "bridge-stage-backdrop", "file": "bridge-stage-backdrop.png", "width": WORLD_WIDTH, "height": WORLD_HEIGHT, "origin": {"x": 0, "y": 0}},
            {"key": "bridge-far-forest", "file": "bridge-far-forest.png", "width": WORLD_WIDTH, "height": WORLD_HEIGHT, "origin": {"x": 0, "y": 0}, "scrollFactor": 0.22},
            {"key": "bridge-mid-forest", "file": "bridge-mid-forest.png", "width": WORLD_WIDTH, "height": WORLD_HEIGHT, "origin": {"x": 0, "y": 0}, "scrollFactor": 0.48},
            {"key": "bridge-stage-foreground-screen", "file": "bridge-stage-foreground-screen.png", "width": 320, "height": 240, "origin": {"x": 0.5, "y": 1}},
            {"key": "bridge-ground-strips", "file": "bridge-ground-strips.png", "width": WORLD_WIDTH, "height": WORLD_HEIGHT, "origin": {"x": 0, "y": 0}},
            {"key": "bridge-crossing-before", "file": "bridge-crossing-before.png", "width": 460, "height": 210, "origin": {"x": 0.5, "y": 0.5}},
            {"key": "bridge-crossing-after", "file": "bridge-crossing-after.png", "width": 460, "height": 210, "origin": {"x": 0.5, "y": 0.5}},
            {"key": "draftsperson-work-zone", "file": "draftsperson-work-zone.png", "width": 430, "height": 230, "origin": {"x": 0.5, "y": 1}},
            {"key": "draftsperson-rest-shelter", "file": "draftsperson-rest-shelter.png", "width": 290, "height": 210, "origin": {"x": 0.5, "y": 1}},
            {"key": "draftsperson-character", "file": "draftsperson-character.png", "width": 128, "height": 170, "origin": {"x": 0.5, "y": 1}},
            {"key": "toy-car-prop", "file": "toy-car-prop.png", "width": 96, "height": 64, "origin": {"x": 0.5, "y": 0.84}},
            {"key": "bridge-role-icons", "file": "bridge-role-icons.png", "width": 288, "height": 96, "frameWidth": 96, "frameHeight": 96, "frameCount": 3},
        ],
        "debugContact": "bridge-debug-contact.png",
    }
    (OUT / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n")


def write_readme() -> None:
    readme = """# Bridge Ridge Runtime Assets

Owner: `src/game/scenes/ridge/**`

Runtime loader: `src/game/scenes/ridge/bridge/assets.ts`

Generated by: `scripts/generate-bridge-assets.py`

## Current Use

Ridge loads these as rough Bridge Visual Coherence Pass placeholders. They are
real runtime images, but they are intentionally replaceable. Phaser still owns
placement, route state, collision, prompts, and toy-car movement.

## Style Contract

- off-white paper and black ink only
- silhouette-first reads at gameplay scale
- hatching and line weight for depth instead of color
- layered PNGs, not one composited stage
- separate far/mid forest layers for lightweight parallax
- Bridge-owned until repeated Ridge asset reuse proves a broader framework

## Runtime Contract

See `manifest.json` for dimensions, origins, and texture keys. The role icon
sheet reserves Cicka, Bridge Draftsperson, and neutral Prompt/narration cells
for the future Character Conversation Overlay.
"""
    (OUT / "README.md").write_text(readme)


def main() -> None:
    random.seed(90)
    OUT.mkdir(parents=True, exist_ok=True)
    create_backdrop()
    create_forest_layer("bridge-far-forest.png", alpha=42, y_offset=-56, scale=1.05, spacing=220)
    create_forest_layer("bridge-mid-forest.png", alpha=76, y_offset=-34, scale=0.88, spacing=165)
    create_foreground_screen()
    create_ground()
    create_bridge_state("bridge-crossing-before.png", completed=False)
    create_bridge_state("bridge-crossing-after.png", completed=True)
    create_work_zone()
    create_rest_shelter()
    create_draftsperson_character()
    create_toy_car()
    create_role_icons()
    create_debug_contact()
    write_manifest()
    write_readme()


if __name__ == "__main__":
    main()
