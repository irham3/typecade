"""Remove a flat magenta key and split a 4x2 character pose sheet."""

from __future__ import annotations

import argparse
from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image


DEFAULT_STATES = (
    "idle-a",
    "idle-b",
    "anticipation",
    "attack",
    "special",
    "hit",
    "recover",
    "defeat",
)


def remove_small_components(source: Image.Image) -> Image.Image:
    rgba = np.asarray(source.convert("RGBA")).copy()
    mask = rgba[:, :, 3] >= 32
    height, width = mask.shape
    visited = np.zeros_like(mask, dtype=bool)
    components: list[list[tuple[int, int]]] = []

    for start_y, start_x in zip(*np.nonzero(mask & ~visited), strict=False):
        if visited[start_y, start_x]:
            continue
        queue = deque([(start_y, start_x)])
        visited[start_y, start_x] = True
        component: list[tuple[int, int]] = []
        while queue:
            y, x = queue.popleft()
            component.append((y, x))
            for offset_y in (-1, 0, 1):
                for offset_x in (-1, 0, 1):
                    if offset_x == 0 and offset_y == 0:
                        continue
                    next_y = y + offset_y
                    next_x = x + offset_x
                    if (
                        0 <= next_y < height
                        and 0 <= next_x < width
                        and mask[next_y, next_x]
                        and not visited[next_y, next_x]
                    ):
                        visited[next_y, next_x] = True
                        queue.append((next_y, next_x))
        components.append(component)

    if not components:
        return Image.fromarray(rgba, "RGBA")

    minimum_size = max(64, round(max(map(len, components)) * 0.005))
    keep = np.zeros_like(mask, dtype=bool)
    for component in components:
        if len(component) < minimum_size:
            continue
        ys, xs = zip(*component, strict=False)
        keep[np.asarray(ys), np.asarray(xs)] = True

    rgba[~keep] = 0
    return Image.fromarray(rgba, "RGBA")


def remove_magenta(source: Image.Image) -> Image.Image:
    rgba = np.asarray(source.convert("RGBA"), dtype=np.float32)
    rgb = rgba[:, :, :3]
    source_alpha = rgba[:, :, 3] / 255.0
    key = np.array([255.0, 0.0, 255.0], dtype=np.float32)

    red = rgb[:, :, 0]
    green = rgb[:, :, 1]
    blue = rgb[:, :, 2]
    magenta_dominance = np.minimum(red, blue) - green
    red_blue_balance = np.abs(red - blue)
    key_strength = magenta_dominance - red_blue_balance * 1.5
    recovered_alpha = np.clip((132.0 - key_strength) / 64.0, 0.0, 1.0)
    recovered_alpha *= source_alpha
    recovered_alpha[recovered_alpha < 0.16] = 0.0

    safe_alpha = np.maximum(recovered_alpha, 1.0 / 255.0)
    recovered_rgb = (
        rgb - key[None, None, :] * (1.0 - recovered_alpha[:, :, None])
    ) / safe_alpha[:, :, None]
    recovered_rgb = np.clip(recovered_rgb, 0.0, 255.0)
    recovered_rgb[recovered_alpha <= 0.01] = 0.0

    output = np.dstack((recovered_rgb, recovered_alpha[:, :, None] * 255.0))
    return Image.fromarray(output.astype(np.uint8), "RGBA")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True, type=Path)
    parser.add_argument("--output-dir", required=True, type=Path)
    parser.add_argument("--states", nargs=8, default=DEFAULT_STATES)
    args = parser.parse_args()

    source = Image.open(args.input).convert("RGBA")
    if source.width % 4 or source.height % 2:
        normalized_width = round(source.width / 4) * 4
        normalized_height = round(source.height / 2) * 2
        source = source.resize(
            (normalized_width, normalized_height),
            Image.Resampling.LANCZOS,
        )

    keyed = remove_magenta(source)
    cell_width = keyed.width // 4
    cell_height = keyed.height // 2
    args.output_dir.mkdir(parents=True, exist_ok=True)

    for index, state in enumerate(args.states):
        column = index % 4
        row = index // 4
        frame = remove_small_components(keyed.crop(
            (
                column * cell_width,
                row * cell_height,
                (column + 1) * cell_width,
                (row + 1) * cell_height,
            )
        ))
        output = args.output_dir / f"{state}.png"
        frame.save(output, optimize=True)
        print(f"Wrote {output} ({cell_width}x{cell_height})")


if __name__ == "__main__":
    main()
