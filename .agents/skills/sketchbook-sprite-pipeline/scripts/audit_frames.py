#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
from pathlib import Path

from PIL import Image


FrameRecord = tuple[str, Image.Image, Image.Image]


def load_image(path: Path):
    source = Image.open(path)
    image = source.convert("RGBA")
    return source, image


def count_alpha_pixels(image: Image.Image) -> tuple[int, int]:
    alpha = image.getchannel("A")
    histogram = alpha.histogram()
    opaque = sum(histogram[250:])
    translucent = sum(histogram[1:250])
    return opaque, translucent


def read_manifest(path: Path | None) -> dict | None:
    if path is None:
        return None
    if not path.exists():
        raise SystemExit(f"Manifest not found: {path}")
    try:
        with path.open("r", encoding="utf-8") as file:
            manifest = json.load(file)
    except json.JSONDecodeError as error:
        raise SystemExit(f"Failed to parse manifest {path}: {error}") from error
    except OSError as error:
        raise SystemExit(f"Failed to read manifest {path}: {error}") from error
    if not isinstance(manifest, dict):
        raise SystemExit(f"Manifest must contain a JSON object: {path}")
    return manifest


def load_frame_dir(frame_dir: Path) -> list[FrameRecord]:
    paths = sorted(frame_dir.glob("*.png"))
    if not paths:
        raise SystemExit(f"No PNG frames found in {frame_dir}")
    return [(path.name, *load_image(path)) for path in paths]


def load_spritesheet_frames(
    spritesheet_path: Path,
    manifest: dict | None
) -> list[FrameRecord]:
    if manifest is None:
        raise SystemExit("--manifest is required when auditing a spritesheet without frame_dir")

    frame_width = manifest.get("frameWidth")
    frame_height = manifest.get("frameHeight")
    frame_count = manifest.get("frameCount")
    if not all(isinstance(value, int) for value in [frame_width, frame_height, frame_count]):
        raise SystemExit("manifest must include integer frameWidth, frameHeight, and frameCount")

    source, sheet = load_image(spritesheet_path)
    records: list[FrameRecord] = []
    frame_entries = manifest.get("frames", [])
    for index in range(frame_count):
        entry = frame_entries[index] if index < len(frame_entries) else {}
        state = entry.get("state") if isinstance(entry, dict) else None
        name = f"{index:02d}-{state}.png" if state else f"{index:02d}.png"
        left = index * frame_width
        crop = sheet.crop((left, 0, left + frame_width, frame_height))
        records.append((name, source, crop))
    return records


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Audit transparent sprite frame dimensions and alpha bounds."
    )
    parser.add_argument(
        "frame_dir",
        nargs="?",
        type=Path,
        help="Directory containing PNG frames. Optional when --spritesheet and --manifest are provided."
    )
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
    if args.frame_dir is None and args.spritesheet is None:
        raise SystemExit("Provide frame_dir or --spritesheet with --manifest")

    manifest = read_manifest(args.manifest)
    records = (
        load_frame_dir(args.frame_dir)
        if args.frame_dir is not None
        else load_spritesheet_frames(args.spritesheet, manifest)
    )

    sizes: set[tuple[int, int]] = set()
    centers: list[float] = []
    bottom_pads: list[int] = []
    warnings: list[str] = []
    errors: list[str] = []

    print(args.frame_dir if args.frame_dir is not None else args.spritesheet)
    for name, source, image in records:
        bbox = image.getchannel("A").getbbox()
        sizes.add(image.size)
        opaque, translucent = count_alpha_pixels(image)
        if bbox is None:
            print(f"{name:36} frame={image.size[0]}x{image.size[1]} empty")
            errors.append(f"{name}: empty alpha bbox")
            continue

        left, top, right, bottom = bbox
        center_x = (left + right) / 2
        bottom_pad = image.size[1] - bottom
        right_pad = image.size[0] - right
        centers.append(center_x)
        bottom_pads.append(bottom_pad)
        print(
            f"{name:36} "
            f"frame={image.size[0]}x{image.size[1]} "
            f"mode={source.mode:4} "
            f"bbox={right-left}x{bottom-top} "
            f"left={left:3} top={top:3} "
            f"bottomPad={bottom_pad:3} centerX={center_x:.1f} "
            f"opaque={opaque:5} translucent={translucent:4}"
        )
        if min(left, top, right_pad, bottom_pad) < 4:
            warnings.append(f"{name}: alpha bbox is close to a frame edge")

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
        expected_size = (manifest.get("frameWidth"), manifest.get("frameHeight"))
        frame_count = manifest.get("frameCount")
        frame_entries = manifest.get("frames", [])
        if expected_size not in sizes:
            errors.append(f"manifest frame size {expected_size} does not match runtime frames")
        if frame_count != len(records):
            errors.append(f"manifest frameCount={frame_count} but found {len(records)} png frames")
        listed_files = {
            Path(entry["file"]).name
            for entry in frame_entries
            if isinstance(entry, dict) and "file" in entry
        }
        if listed_files and args.frame_dir is not None:
            actual_files = {name for name, _, _ in records}
            missing = sorted(listed_files - actual_files)
            unlisted = sorted(actual_files - listed_files)
            if missing:
                errors.append(f"manifest lists missing files: {', '.join(missing)}")
            if unlisted:
                warnings.append(f"frames are not listed in manifest: {', '.join(unlisted)}")
        else:
            frame_indexes = [
                entry.get("index")
                for entry in frame_entries
                if isinstance(entry, dict) and "index" in entry
            ]
            if frame_indexes and sorted(frame_indexes) != list(range(len(records))):
                errors.append("manifest frame indexes do not match the audited frame count")

    if args.spritesheet:
        _, spritesheet = load_image(args.spritesheet)
        if len(sizes) == 1:
            frame_width, frame_height = next(iter(sizes))
            expected_sheet_size = (frame_width * len(records), frame_height)
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
