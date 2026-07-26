"""Build a Pixi-compatible modular rig atlas from a chroma-key source sheet."""

from __future__ import annotations

import argparse
import json
from collections import deque
from dataclasses import dataclass
from math import ceil
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw


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
    "packet": ("locomotion", "idle", "anticipation", "attack", "hit", "defeat", "special"),
    "needle": ("locomotion", "idle", "anticipation", "attack", "hit", "defeat", "special"),
    "null": ("locomotion", "idle", "anticipation", "attack", "hit", "defeat", "special"),
}


@dataclass(frozen=True)
class PackedPart:
    name: str
    image: Image.Image
    pivot: tuple[int, int]
    x: int
    y: int


@dataclass(frozen=True)
class SourceComponent:
    label: int
    size: int
    bounds: tuple[int, int, int, int]
    center: tuple[float, float]


def remove_magenta(source: Image.Image) -> Image.Image:
    rgba = np.asarray(source.convert("RGBA"), dtype=np.float32)
    rgb = rgba[:, :, :3]
    height, width, _ = rgba.shape
    band = max(1, min(width, height, 6))
    border = np.concatenate(
        (
            rgb[:band].reshape(-1, 3),
            rgb[-band:].reshape(-1, 3),
            rgb[:, :band].reshape(-1, 3),
            rgb[:, -band:].reshape(-1, 3),
        ),
        axis=0,
    )
    key = np.median(border, axis=0)
    distance = np.max(np.abs(rgb - key[None, None, :]), axis=2)
    key_max = float(np.max(key))
    spill_channels = [
        index
        for index, value in enumerate(key)
        if value >= key_max - 16 and value >= 128
    ]
    non_spill = [
        index
        for index in range(3)
        if index not in spill_channels
    ]
    key_strength = np.min(rgb[:, :, spill_channels], axis=2)
    non_key_strength = np.max(rgb[:, :, non_spill], axis=2)
    dominance = key_strength - non_key_strength
    key_like = (distance <= 96) | (dominance >= 16)
    candidate_image = Image.fromarray(
        (key_like.astype(np.uint8) * 255),
        "L",
    ).copy()
    for seed in (
        (0, 0),
        (width - 1, 0),
        (0, height - 1),
        (width - 1, height - 1),
    ):
        ImageDraw.floodfill(candidate_image, seed, 128, thresh=0)
    background = np.asarray(candidate_image) == 128

    denominator = np.maximum(1.0, key_max - non_key_strength)
    dominance_alpha = 1.0 - np.minimum(
        1.0,
        np.maximum(0.0, dominance) / denominator,
    )
    near_background = np.zeros(background.shape, dtype=bool)
    near_background[1:, :] |= background[:-1, :]
    near_background[:-1, :] |= background[1:, :]
    near_background[:, 1:] |= background[:, :-1]
    near_background[:, :-1] |= background[:, 1:]
    edge = near_background & ~background & (dominance > 0)

    alpha = rgba[:, :, 3] / 255.0
    alpha[background] = 0.0
    alpha[edge] = np.minimum(alpha[edge], dominance_alpha[edge])
    alpha[alpha <= 8 / 255] = 0.0

    recovered = rgb.copy()
    cap = np.maximum(0.0, non_key_strength - 1.0)
    for channel in spill_channels:
        recovered[:, :, channel] = np.where(
            edge,
            np.minimum(recovered[:, :, channel], cap),
            recovered[:, :, channel],
        )
    recovered[alpha == 0] = 0
    output = np.dstack((recovered, alpha[:, :, None] * 255.0))
    return Image.fromarray(output.astype(np.uint8), "RGBA")


def find_components(source: Image.Image) -> tuple[np.ndarray, list[SourceComponent]]:
    mask = np.asarray(source.convert("RGBA"))[:, :, 3] >= 32
    height, width = mask.shape
    labels = np.zeros(mask.shape, dtype=np.int32)
    components: list[SourceComponent] = []
    next_label = 0

    for start_y, start_x in zip(*np.nonzero(mask), strict=False):
        if labels[start_y, start_x] != 0:
            continue
        next_label += 1
        queue = deque([(start_y, start_x)])
        labels[start_y, start_x] = next_label
        size = 0
        minimum_x = maximum_x = start_x
        minimum_y = maximum_y = start_y
        total_x = 0
        total_y = 0
        while queue:
            y, x = queue.popleft()
            size += 1
            total_x += x
            total_y += y
            minimum_x = min(minimum_x, x)
            maximum_x = max(maximum_x, x)
            minimum_y = min(minimum_y, y)
            maximum_y = max(maximum_y, y)
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
                        and labels[next_y, next_x] == 0
                    ):
                        labels[next_y, next_x] = next_label
                        queue.append((next_y, next_x))
        components.append(SourceComponent(
            label=next_label,
            size=size,
            bounds=(
                minimum_x,
                minimum_y,
                maximum_x + 1,
                maximum_y + 1,
            ),
            center=(total_x / size, total_y / size),
        ))

    return labels, components


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
    labels, components = find_components(keyed)
    if not components:
        raise ValueError(f"No visible components found for {rig_id}")
    largest = max(component.size for component in components)
    minimum_size = max(48, round(largest * 0.004))
    material = [
        component
        for component in components
        if component.size >= minimum_size
    ]
    grouped: list[list[SourceComponent]] = [[] for _ in parts]

    for component in material:
        center_x, center_y = component.center
        column = min(columns - 1, max(0, int(center_x / cell_width)))
        row = min(rows - 1, max(0, int(center_y / cell_height)))
        index = row * columns + column
        if index >= len(parts):
            raise ValueError(f"Unexpected component in empty cell {row + 1},{column + 1}")
        grouped[index].append(component)

    rgba = np.asarray(keyed.convert("RGBA"))
    extracted: list[tuple[str, Image.Image, tuple[int, int]]] = []
    for name, part_components in zip(parts, grouped, strict=True):
        if not part_components:
            raise ValueError(f"Missing visible part {name}")
        minimum_x = min(component.bounds[0] for component in part_components)
        minimum_y = min(component.bounds[1] for component in part_components)
        maximum_x = max(component.bounds[2] for component in part_components)
        maximum_y = max(component.bounds[3] for component in part_components)
        if (
            minimum_x <= 0
            or minimum_y <= 0
            or maximum_x >= keyed.width
            or maximum_y >= keyed.height
        ):
            raise ValueError(f"{name} touches the source sheet edge")
        selected_labels = np.asarray(
            [component.label for component in part_components],
            dtype=np.int32,
        )
        label_crop = labels[minimum_y:maximum_y, minimum_x:maximum_x]
        visible = np.isin(label_crop, selected_labels)
        part_rgba = rgba[minimum_y:maximum_y, minimum_x:maximum_x].copy()
        part_rgba[~visible] = 0
        trimmed = Image.fromarray(part_rgba, "RGBA")
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
        frames[f"{rig_id}/{part.name}"] = {
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
