#!/usr/bin/env python3
from __future__ import annotations

import argparse
import math
from pathlib import Path

from PIL import Image


Rgb = tuple[int, int, int]


def clamp_channel(value: float) -> int:
    return max(0, min(255, round(value)))


def average_border_color(image: Image.Image) -> Rgb:
    width, height = image.size
    pixels = image.load()
    samples: list[Rgb] = []

    for x in range(width):
        for y in (0, height - 1):
            red, green, blue, alpha = pixels[x, y]
            if alpha > 0:
                samples.append((red, green, blue))

    for y in range(1, max(1, height - 1)):
        for x in (0, width - 1):
            red, green, blue, alpha = pixels[x, y]
            if alpha > 0:
                samples.append((red, green, blue))

    if not samples:
        raise SystemExit("Cannot infer key color from a fully transparent border")

    return (
        round(sum(red for red, _, _ in samples) / len(samples)),
        round(sum(green for _, green, _ in samples) / len(samples)),
        round(sum(blue for _, _, blue in samples) / len(samples)),
    )


def parse_hex_color(value: str) -> Rgb:
    color = value.removeprefix("#")
    if len(color) != 6:
        raise argparse.ArgumentTypeError("Expected a hex color like #ff00ff")
    try:
        return (
            int(color[0:2], 16),
            int(color[2:4], 16),
            int(color[4:6], 16),
        )
    except ValueError as error:
        raise argparse.ArgumentTypeError("Expected a hex color like #ff00ff") from error


def color_distance(left: Rgb, right: Rgb) -> float:
    return math.sqrt(sum((left[index] - right[index]) ** 2 for index in range(3)))


def keyed_alpha(
    distance: float,
    *,
    transparent_threshold: int,
    opaque_threshold: int,
    soft_matte: bool,
) -> int:
    if distance <= transparent_threshold:
        return 0
    if not soft_matte or distance >= opaque_threshold:
        return 255

    threshold_span = max(1, opaque_threshold - transparent_threshold)
    return clamp_channel(255 * (distance - transparent_threshold) / threshold_span)


def despill_pixel(red: int, green: int, blue: int, alpha: int, key: Rgb) -> Rgb:
    if alpha <= 0 or alpha >= 255:
        return red, green, blue

    channels = [red, green, blue]
    max_key = max(key)
    if max_key < 180:
        return red, green, blue

    key_channels = [index for index, value in enumerate(key) if value >= max_key - 24]
    non_key_channels = [index for index in range(3) if index not in key_channels]
    if not key_channels or not non_key_channels:
        return red, green, blue

    non_key_ceiling = max(channels[index] for index in non_key_channels)
    spill_mix = 1 - alpha / 255
    for index in key_channels:
        channels[index] = clamp_channel(
            channels[index] * (1 - spill_mix) + min(channels[index], non_key_ceiling) * spill_mix
        )
    return channels[0], channels[1], channels[2]


def remove_chroma_key(
    input_path: Path,
    output_path: Path,
    *,
    key_color: Rgb | None,
    auto_key: str | None,
    transparent_threshold: int,
    opaque_threshold: int,
    soft_matte: bool,
    despill: bool,
) -> None:
    image = Image.open(input_path).convert("RGBA")
    key = average_border_color(image) if auto_key == "border" else key_color
    if key is None:
        raise SystemExit("Provide --key-color or --auto-key border")

    pixels = image.load()
    width, height = image.size
    for y in range(height):
        for x in range(width):
            red, green, blue, source_alpha = pixels[x, y]
            alpha = keyed_alpha(
                color_distance((red, green, blue), key),
                transparent_threshold=transparent_threshold,
                opaque_threshold=opaque_threshold,
                soft_matte=soft_matte,
            )
            alpha = min(source_alpha, alpha)
            if despill:
                red, green, blue = despill_pixel(red, green, blue, alpha, key)
            pixels[x, y] = red, green, blue, alpha

    output_path.parent.mkdir(parents=True, exist_ok=True)
    image.save(output_path)


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Remove a flat chroma-key background from a PNG."
    )
    parser.add_argument("--input", required=True, type=Path, help="Input PNG")
    parser.add_argument("--out", required=True, type=Path, help="Output PNG")
    parser.add_argument(
        "--key-color",
        type=parse_hex_color,
        help="Explicit key color, e.g. #ff00ff or #00ff00",
    )
    parser.add_argument(
        "--auto-key",
        choices=("border",),
        help="Infer the key color from the image border",
    )
    parser.add_argument("--transparent-threshold", type=int, default=12)
    parser.add_argument("--opaque-threshold", type=int, default=220)
    parser.add_argument("--soft-matte", action="store_true")
    parser.add_argument("--despill", action="store_true")
    args = parser.parse_args()

    remove_chroma_key(
        args.input,
        args.out,
        key_color=args.key_color,
        auto_key=args.auto_key,
        transparent_threshold=args.transparent_threshold,
        opaque_threshold=args.opaque_threshold,
        soft_matte=args.soft_matte,
        despill=args.despill,
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
