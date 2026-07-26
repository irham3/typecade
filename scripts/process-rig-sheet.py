"""Build a Pixi-compatible modular rig atlas from a chroma-key source sheet."""

from __future__ import annotations

import argparse
import json
from collections import deque
from dataclasses import dataclass
from math import ceil
from pathlib import Path

import numpy as np
from PIL import Image


ATLAS_SIZE = 2048
PADDING = 4

RIG_PARTS = {
    "warden": (
        "torso",
        "pelvis",
        "head",
        "visor",
        "near_shoulder",
        "far_shoulder",
        "near_upper_arm",
        "far_upper_arm",
        "near_forearm",
        "far_forearm",
        "cannon_barrel",
        "cannon_core",
        "near_thigh",
        "far_thigh",
        "near_shin",
        "far_shin",
        "near_foot",
        "far_foot",
    ),
    "packet": (
        "core_torso",
        "head",
        "jaw",
        "near_front_upper_leg",
        "near_front_lower_leg",
        "far_front_upper_leg",
        "far_front_lower_leg",
        "near_rear_upper_leg",
        "near_rear_lower_leg",
        "far_rear_upper_leg",
        "far_rear_lower_leg",
        "tail_base",
        "tail_tip",
        "near_back_plate",
        "far_back_plate",
    ),
    "needle": (
        "chest_core",
        "head",
        "neck_segment",
        "spine_front",
        "spine_rear",
        "near_blade_upper_arm",
        "near_blade_forearm",
        "far_blade_upper_arm",
        "far_blade_forearm",
        "near_fin",
        "far_fin",
        "tail_segment_one",
        "tail_segment_two",
        "tail_tip",
    ),
    "null": (
        "void_core",
        "crown_center",
        "crown_near_plate",
        "crown_far_plate",
        "near_shoulder",
        "far_shoulder",
        "near_upper_arm",
        "far_upper_arm",
        "near_forearm",
        "far_forearm",
        "near_hand",
        "far_hand",
        "cloak_segment_one",
        "cloak_segment_two",
        "cloak_segment_three",
        "lower_core",
    ),
}

RIG_COLUMNS = {
    "warden": 6,
    "packet": 5,
    "needle": 5,
    "null": 4,
}

RIG_CLIPS = {
    "warden": (
        "idle",
        "ready",
        "chain-1",
        "chain-2",
        "chain-3",
        "dash",
        "execute",
        "block",
        "hurt",
        "recover",
        "overdrive",
    ),
    "packet": ("locomotion", "anticipation", "attack", "hit", "defeat", "special"),
    "needle": ("locomotion", "anticipation", "attack", "hit", "defeat", "special"),
    "null": ("locomotion", "anticipation", "attack", "hit", "defeat", "special"),
}


@dataclass(frozen=True)
class PackedPart:
    name: str
    image: Image.Image
    pivot: tuple[int, int]
    x: int
    y: int


def remove_magenta(source: Image.Image) -> Image.Image:
    rgba = np.asarray(source.convert("RGBA"), dtype=np.float32)
    rgb = rgba[:, :, :3]
    source_alpha = rgba[:, :, 3] / 255.0
    red = rgb[:, :, 0]
    green = rgb[:, :, 1]
    blue = rgb[:, :, 2]
    dominance = np.minimum(red, blue) - green
    balance = np.abs(red - blue)
    key_strength = dominance - balance * 1.5
    alpha = np.clip((132.0 - key_strength) / 64.0, 0.0, 1.0)
    alpha *= source_alpha
    alpha[alpha < 0.16] = 0.0

    safe_alpha = np.maximum(alpha, 1.0 / 255.0)
    recovered = (
        rgb - np.array([255.0, 0.0, 255.0])[None, None, :] * (1.0 - alpha[:, :, None])
    ) / safe_alpha[:, :, None]
    recovered = np.clip(recovered, 0.0, 255.0)
    recovered[alpha <= 0.01] = 0.0
    output = np.dstack((recovered, alpha[:, :, None] * 255.0))
    return Image.fromarray(output.astype(np.uint8), "RGBA")


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

    largest = max(map(len, components))
    minimum_size = max(48, round(largest * 0.004))
    keep = np.zeros_like(mask, dtype=bool)
    for component in components:
        if len(component) < minimum_size:
            continue
        ys, xs = zip(*component, strict=False)
        keep[np.asarray(ys), np.asarray(xs)] = True
    rgba[~keep] = 0
    return Image.fromarray(rgba, "RGBA")


def touches_edge(source: Image.Image) -> bool:
    alpha = np.asarray(source.getchannel("A"))
    visible = alpha >= 32
    return bool(
        visible[:2, :].any()
        or visible[-2:, :].any()
        or visible[:, :2].any()
        or visible[:, -2:].any()
    )


def pivot_factor(part_name: str) -> tuple[float, float]:
    if part_name in {
        "torso",
        "core_torso",
        "chest_core",
        "void_core",
        "pelvis",
        "lower_core",
        "head",
        "cannon_core",
        "crown_center",
    }:
        return 0.5, 0.5
    if "foot" in part_name:
        return 0.24, 0.52
    if (
        "upper_arm" in part_name
        or "upper_leg" in part_name
        or "thigh" in part_name
        or "shoulder" in part_name
    ):
        return 0.5, 0.18
    if (
        "forearm" in part_name
        or "lower_leg" in part_name
        or "shin" in part_name
        or "cloak_segment" in part_name
    ):
        return 0.5, 0.16
    if (
        "tail" in part_name
        or "spine" in part_name
        or "neck" in part_name
        or "cannon_barrel" in part_name
    ):
        return 0.18, 0.5
    if "plate" in part_name or "fin" in part_name:
        return 0.5, 0.72
    return 0.5, 0.5


def extract_parts(source: Image.Image, rig_id: str) -> list[tuple[str, Image.Image, tuple[int, int]]]:
    parts = RIG_PARTS[rig_id]
    columns = RIG_COLUMNS[rig_id]
    rows = ceil(len(parts) / columns)
    if source.width % columns or source.height % rows:
        raise ValueError(
            f"{rig_id} source must divide into {columns} columns and {rows} rows"
        )

    keyed = remove_magenta(source)
    cell_width = int(keyed.width / columns)
    cell_height = int(keyed.height / rows)
    extracted: list[tuple[str, Image.Image, tuple[int, int]]] = []

    for index, name in enumerate(parts):
        row, column = divmod(index, columns)
        cell = keyed.crop(
            (
                column * cell_width,
                row * cell_height,
                (column + 1) * cell_width,
                (row + 1) * cell_height,
            )
        )
        if touches_edge(cell):
            raise ValueError(f"{name} touches its source cell edge")
        cleaned = remove_small_components(cell)
        bounds = cleaned.getchannel("A").getbbox()
        if bounds is None:
            raise ValueError(f"Missing visible part {name}")
        trimmed = cleaned.crop(bounds)
        padded = Image.new(
            "RGBA",
            (trimmed.width + PADDING * 2, trimmed.height + PADDING * 2),
            (0, 0, 0, 0),
        )
        padded.alpha_composite(trimmed, (PADDING, PADDING))
        factor_x, factor_y = pivot_factor(name)
        pivot = (
            PADDING + round(trimmed.width * factor_x),
            PADDING + round(trimmed.height * factor_y),
        )
        extracted.append((name, padded, pivot))

    return extracted


def pack_parts(
    extracted: list[tuple[str, Image.Image, tuple[int, int]]],
) -> list[PackedPart]:
    packed: list[PackedPart] = []
    cursor_x = PADDING
    cursor_y = PADDING
    row_height = 0

    for name, image, pivot in extracted:
        if image.width + PADDING * 2 > ATLAS_SIZE:
            raise ValueError(f"{name} is wider than the atlas")
        if cursor_x + image.width + PADDING > ATLAS_SIZE:
            cursor_x = PADDING
            cursor_y += row_height + PADDING
            row_height = 0
        if cursor_y + image.height + PADDING > ATLAS_SIZE:
            raise ValueError("Rig parts exceed the 2048 by 2048 atlas")
        packed.append(PackedPart(name, image, pivot, cursor_x, cursor_y))
        cursor_x += image.width + PADDING
        row_height = max(row_height, image.height)

    return packed


def write_outputs(
    packed: list[PackedPart],
    rig_id: str,
    source_path: Path,
    output_dir: Path,
) -> None:
    output_dir.mkdir(parents=True, exist_ok=True)
    image_name = f"{rig_id}-rig-v1.webp"
    json_name = f"{rig_id}-rig-v1.json"
    atlas = Image.new("RGBA", (ATLAS_SIZE, ATLAS_SIZE), (0, 0, 0, 0))
    frames: dict[str, object] = {}
    rig_parts: dict[str, object] = {}

    for part in packed:
        atlas.alpha_composite(part.image, (part.x, part.y))
        width, height = part.image.size
        frames[part.name] = {
            "frame": {"x": part.x, "y": part.y, "w": width, "h": height},
            "rotated": False,
            "trimmed": False,
            "spriteSourceSize": {"x": 0, "y": 0, "w": width, "h": height},
            "sourceSize": {"w": width, "h": height},
            "anchor": {
                "x": part.pivot[0] / width,
                "y": part.pivot[1] / height,
            },
        }
        rig_parts[part.name] = {
            "pivot": {"x": part.pivot[0], "y": part.pivot[1]},
        }

    image_path = output_dir / image_name
    json_path = output_dir / json_name
    atlas.save(image_path, "WEBP", lossless=True, quality=100, method=6)
    payload = {
        "frames": frames,
        "meta": {
            "app": "Typecade rig pipeline",
            "version": "1.0",
            "image": image_name,
            "format": "RGBA8888",
            "size": {"w": ATLAS_SIZE, "h": ATLAS_SIZE},
            "scale": "1",
            "rig": {
                "id": rig_id,
                "source": source_path.as_posix(),
                "parts": rig_parts,
                "clips": list(RIG_CLIPS[rig_id]),
            },
        },
    }
    json_path.write_text(
        json.dumps(payload, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )
    print(f"Wrote {image_path}")
    print(f"Wrote {json_path}")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True, type=Path)
    parser.add_argument("--rig", required=True, choices=tuple(RIG_PARTS))
    parser.add_argument("--output-dir", required=True, type=Path)
    args = parser.parse_args()

    source = Image.open(args.input).convert("RGBA")
    columns = RIG_COLUMNS[args.rig]
    rows = ceil(len(RIG_PARTS[args.rig]) / columns)
    normalized_width = round(source.width / columns) * columns
    normalized_height = round(source.height / rows) * rows
    if source.size != (normalized_width, normalized_height):
        source = source.resize(
            (normalized_width, normalized_height),
            Image.Resampling.LANCZOS,
        )
    extracted = extract_parts(source, args.rig)
    packed = pack_parts(extracted)
    write_outputs(packed, args.rig, args.input, args.output_dir)


if __name__ == "__main__":
    main()
