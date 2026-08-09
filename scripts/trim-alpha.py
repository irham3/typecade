"""Trim transparent padding from a PNG while keeping a safe edge margin."""

from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    parser.add_argument("--padding", type=int, default=24)
    args = parser.parse_args()

    source = Image.open(args.input).convert("RGBA")
    alpha_bounds = source.getchannel("A").getbbox()
    if alpha_bounds is None:
        raise ValueError(f"No visible pixels in {args.input}")

    cropped = source.crop(alpha_bounds)
    padding = max(0, args.padding)
    output = Image.new(
        "RGBA",
        (cropped.width + padding * 2, cropped.height + padding * 2),
        (0, 0, 0, 0),
    )
    output.alpha_composite(cropped, (padding, padding))
    args.output.parent.mkdir(parents=True, exist_ok=True)
    output.save(args.output, optimize=True)
    print(f"Wrote {args.output} ({output.width}x{output.height})")


if __name__ == "__main__":
    main()
