#!/usr/bin/env python3
from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image


def alpha_bbox(path: Path):
    image = Image.open(path).convert("RGBA")
    return image, image.getchannel("A").getbbox()


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Audit transparent sprite frame dimensions and alpha bounds."
    )
    parser.add_argument("frame_dir", type=Path, help="Directory containing PNG frames")
    args = parser.parse_args()

    paths = sorted(args.frame_dir.glob("*.png"))
    if not paths:
        raise SystemExit(f"No PNG frames found in {args.frame_dir}")

    sizes: set[tuple[int, int]] = set()
    centers: list[float] = []
    bottom_pads: list[int] = []

    print(args.frame_dir)
    for path in paths:
        image, bbox = alpha_bbox(path)
        sizes.add(image.size)
        if bbox is None:
            print(f"{path.name:36} frame={image.size[0]}x{image.size[1]} empty")
            continue

        left, top, right, bottom = bbox
        center_x = (left + right) / 2
        bottom_pad = image.size[1] - bottom
        centers.append(center_x)
        bottom_pads.append(bottom_pad)
        print(
            f"{path.name:36} "
            f"frame={image.size[0]}x{image.size[1]} "
            f"bbox={right-left}x{bottom-top} "
            f"left={left:3} top={top:3} "
            f"bottomPad={bottom_pad:3} centerX={center_x:.1f}"
        )

    print()
    print(f"frameSizes={sorted(sizes)}")
    if centers:
        print(f"centerXRange={min(centers):.1f}-{max(centers):.1f}")
    if bottom_pads:
        print(f"bottomPadRange={min(bottom_pads)}-{max(bottom_pads)}")

    if len(sizes) > 1:
        print("WARN: runtime frames do not share one frame size")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
