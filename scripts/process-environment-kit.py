"""Extract the Signal Trench parallax layers from the approved source sheet."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw


PANELS = (
    ("far", (0, 18, 1536, 212), 0.5),
    ("machinery", (0, 233, 1536, 374), 1.0),
    ("midground", (0, 388, 1536, 539), 1.0),
    ("deck", (0, 540, 1536, 669), 1.0),
    ("foreground", (0, 681, 1536, 848), 1.0),
    ("atmosphere", (0, 867, 1536, 1000), 0.5),
)

CHROMA_KEY = np.asarray((250, 3, 246), dtype=np.float32)

AUTHORED_POINTS = {
    "sparks": (
        {"layer": "machinery", "x": 0.22, "y": 0.68},
        {"layer": "machinery", "x": 0.63, "y": 0.54},
        {"layer": "midground", "x": 0.36, "y": 0.42},
        {"layer": "foreground", "x": 0.78, "y": 0.34},
    ),
    "cables": (
        {"layer": "midground", "x": 0.15, "y": 0.38},
        {"layer": "midground", "x": 0.72, "y": 0.26},
        {"layer": "foreground", "x": 0.88, "y": 0.3},
    ),
    "gates": (
        {"layer": "midground", "x": 0.9, "y": 0.58},
        {"layer": "machinery", "x": 0.52, "y": 0.52},
    ),
    "lights": (
        {"layer": "far", "x": 0.42, "y": 0.38},
        {"layer": "machinery", "x": 0.68, "y": 0.46},
        {"layer": "foreground", "x": 0.26, "y": 0.38},
    ),
}


def remove_magenta(source: Image.Image) -> Image.Image:
    rgba = np.asarray(source.convert("RGBA"), dtype=np.float32)
    rgb = rgba[:, :, :3]
    height, width, _ = rgba.shape
    key = CHROMA_KEY
    distance = np.max(np.abs(rgb - key[None, None, :]), axis=2)
    key_max = float(np.max(key))
    spill_channels = [
        index
        for index, value in enumerate(key)
        if value >= key_max - 16 and value >= 128
    ]
    non_spill = [index for index in range(3) if index not in spill_channels]
    key_strength = np.min(rgb[:, :, spill_channels], axis=2)
    non_key_strength = np.max(rgb[:, :, non_spill], axis=2)
    dominance = key_strength - non_key_strength
    key_like = (distance <= 96) | (dominance >= 16)
    candidate = Image.fromarray((key_like.astype(np.uint8) * 255), "L").copy()
    for seed in (
        (0, 0),
        (width - 1, 0),
        (0, height - 1),
        (width - 1, height - 1),
    ):
        ImageDraw.floodfill(candidate, seed, 128, thresh=0)
    background = np.asarray(candidate) == 128

    near_background = np.zeros(background.shape, dtype=bool)
    near_background[1:, :] |= background[:-1, :]
    near_background[:-1, :] |= background[1:, :]
    near_background[:, 1:] |= background[:, :-1]
    near_background[:, :-1] |= background[:, 1:]
    edge = near_background & ~background & (dominance > 0)
    denominator = np.maximum(1.0, key_max - non_key_strength)
    feather = 1.0 - np.minimum(
        1.0,
        np.maximum(0.0, dominance) / denominator,
    )

    alpha = rgba[:, :, 3] / 255.0
    alpha[background] = 0.0
    alpha[edge] = np.minimum(alpha[edge], feather[edge])
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


def trim_alpha(image: Image.Image) -> Image.Image:
    alpha = image.getchannel("A")
    bounds = alpha.getbbox()
    if bounds is None:
        raise ValueError("Environment panel has no visible pixels")
    return image.crop(bounds)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True, type=Path)
    parser.add_argument("--output-dir", required=True, type=Path)
    args = parser.parse_args()

    source = Image.open(args.input).convert("RGBA")
    if source.size != (1536, 1024):
        raise ValueError("Signal Trench source must be exactly 1536 by 1024")

    args.output_dir.mkdir(parents=True, exist_ok=True)
    layers: list[dict[str, object]] = []
    for role, bounds, runtime_scale in PANELS:
        layer = trim_alpha(remove_magenta(source.crop(bounds)))
        if runtime_scale != 1:
            layer = layer.resize(
                (
                    max(1, round(layer.width * runtime_scale)),
                    max(1, round(layer.height * runtime_scale)),
                ),
                Image.Resampling.LANCZOS,
            )
        file_name = f"signal-trench-{role}-v1.webp"
        output_path = args.output_dir / file_name
        layer.save(output_path, "WEBP", quality=92, method=6, exact=True)
        alpha = np.asarray(layer.getchannel("A"))
        layers.append(
            {
                "role": role,
                "src": f"/overdrive/art/environment/{file_name}",
                "width": layer.width,
                "height": layer.height,
                "hasAlpha": bool(np.any(alpha < 255)),
                "alphaCoverage": round(float(np.count_nonzero(alpha) / alpha.size), 4),
                "sourceBounds": {
                    "x": bounds[0],
                    "y": bounds[1],
                    "width": bounds[2] - bounds[0],
                    "height": bounds[3] - bounds[1],
                },
            }
        )

    manifest = {
        "id": "signal-trench-v1",
        "source": args.input.as_posix(),
        "layers": layers,
        "points": AUTHORED_POINTS,
    }
    manifest_path = args.output_dir / "signal-trench-kit-v1.json"
    manifest_path.write_text(
        json.dumps(manifest, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )
    print(f"Wrote {len(layers)} layers and {manifest_path}")


if __name__ == "__main__":
    main()
