#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
from pathlib import Path

from PIL import Image


def load_image(path: Path):
    source = Image.open(path)
    image = source.convert("RGBA")
    return source, image


def alpha_bbox(path: Path):
    _, image = load_image(path)
    return image, image.getchannel("A").getbbox()


def count_alpha_pixels(image: Image.Image) -> tuple[int, int]:
    alpha = image.getchannel("A")
    opaque = 0
    translucent = 0
    alpha_values = (
        alpha.get_flattened_data()
        if hasattr(alpha, "get_flattened_data")
        else alpha.getdata()
    )
    for value in alpha_values:
        if value >= 250:
            opaque += 1
        elif value > 0:
            translucent += 1
    return opaque, translucent


def read_manifest(path: Path | None) -> dict | None:
    if path is None:
        return None
    with path.open("r", encoding="utf-8") as file:
        return json.load(file)


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Audit transparent sprite frame dimensions and alpha bounds."
    )
    parser.add_argument("frame_dir", type=Path, help="Directory containing PNG frames")
    parser.add_argument(
        "--manifest",
        type=Path,
        help="Optional manifest.json to validate frame dimensions, count, and listed files"
    )
    parser.add_argument(
        "--spritesheet",
        type=Path,
        help="Optional horizontal spritesheet to validate against frame dimensions"
    )
    args = parser.parse_args()

    paths = sorted(args.frame_dir.glob("*.png"))
    if not paths:
        raise SystemExit(f"No PNG frames found in {args.frame_dir}")

    manifest = read_manifest(args.manifest)
    expected_size = None
    if manifest:
        expected_size = (manifest.get("frameWidth"), manifest.get("frameHeight"))

    sizes: set[tuple[int, int]] = set()
    centers: list[float] = []
    bottom_pads: list[int] = []
    warnings: list[str] = []
    errors: list[str] = []

    print(args.frame_dir)
    for path in paths:
        source, image = load_image(path)
        bbox = image.getchannel("A").getbbox()
        sizes.add(image.size)
        opaque, translucent = count_alpha_pixels(image)
        if bbox is None:
            print(f"{path.name:36} frame={image.size[0]}x{image.size[1]} empty")
            errors.append(f"{path.name}: empty alpha bbox")
            continue

        left, top, right, bottom = bbox
        center_x = (left + right) / 2
        bottom_pad = image.size[1] - bottom
        right_pad = image.size[0] - right
        centers.append(center_x)
        bottom_pads.append(bottom_pad)
        print(
            f"{path.name:36} "
            f"frame={image.size[0]}x{image.size[1]} "
            f"mode={source.mode:4} "
            f"bbox={right-left}x{bottom-top} "
            f"left={left:3} top={top:3} "
            f"bottomPad={bottom_pad:3} centerX={center_x:.1f} "
            f"opaque={opaque:5} translucent={translucent:4}"
        )
        if min(left, top, right_pad, bottom_pad) < 4:
            warnings.append(f"{path.name}: alpha bbox is close to a frame edge")

    print()
    print(f"frameSizes={sorted(sizes)}")
    if centers:
        print(f"centerXRange={min(centers):.1f}-{max(centers):.1f}")
    if bottom_pads:
        print(f"bottomPadRange={min(bottom_pads)}-{max(bottom_pads)}")

    if len(sizes) > 1:
        errors.append("runtime frames do not share one frame size")
    if centers and max(centers) - min(centers) > 4:
        warnings.append("center anchor drift is greater than 4px")
    if bottom_pads and max(bottom_pads) - min(bottom_pads) > 2:
        warnings.append("bottom padding drift is greater than 2px")

    if manifest:
        frame_count = manifest.get("frameCount")
        frame_entries = manifest.get("frames", [])
        if expected_size not in sizes:
            errors.append(f"manifest frame size {expected_size} does not match runtime frames")
        if frame_count != len(paths):
            errors.append(f"manifest frameCount={frame_count} but found {len(paths)} png frames")
        listed_files = {Path(entry.get("file", "")).name for entry in frame_entries}
        actual_files = {path.name for path in paths}
        missing = sorted(listed_files - actual_files)
        unlisted = sorted(actual_files - listed_files)
        if missing:
            errors.append(f"manifest lists missing files: {', '.join(missing)}")
        if unlisted:
            warnings.append(f"frames are not listed in manifest: {', '.join(unlisted)}")

    if args.spritesheet:
        _, spritesheet = load_image(args.spritesheet)
        if len(sizes) == 1:
            frame_width, frame_height = next(iter(sizes))
            expected_sheet_size = (frame_width * len(paths), frame_height)
            if spritesheet.size != expected_sheet_size:
                errors.append(
                    f"spritesheet size {spritesheet.size} does not match "
                    f"expected horizontal sheet {expected_sheet_size}"
                )

    if warnings:
        print()
        for warning in warnings:
            print(f"WARN: {warning}")
    if errors:
        print()
        for error in errors:
            print(f"ERROR: {error}")
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
