from __future__ import annotations

import json
import math
import os
import shutil
import subprocess
import wave
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "apps" / "web" / "public" / "assets" / "ocean"
KENNEY = ROOT / ".asset-sources" / "kenney_fish-pack_2" / "PNG" / "Default"

FISH_STATES = ["idle", "swim", "bite", "struggle", "stunned", "caught", "escape"]
COMMON_FRAME_COUNT = 4
RARE_FRAME_COUNT = 6

SPECIES = [
    ("reef_minnow", "common", (80, 212, 158), (34, 82, 92), "stripe"),
    ("kelp_darter", "common", (59, 185, 221), (24, 64, 96), "dash"),
    ("sunny_guppy", "common", (246, 196, 68), (55, 79, 92), "spot"),
    ("shellback_puffer", "common", (112, 205, 139), (39, 77, 69), "armor"),
    ("tide_skipper", "common", (101, 220, 203), (31, 74, 91), "swarm"),
    ("coral_fry", "common", (236, 103, 128), (72, 47, 82), "coral"),
    ("moonfin_snapper", "rare", (204, 91, 211), (38, 67, 152), "moon"),
    ("glass_eel", "uncommon", (151, 239, 232), (44, 98, 151), "glass"),
    ("reef_shark", "rare", (77, 132, 167), (19, 43, 66), "shark"),
    ("crown_leviathan", "boss", (234, 75, 110), (22, 41, 68), "crown"),
]

UI_NAVY = (8, 25, 48, 238)
UI_BORDER = (142, 211, 230, 255)
UI_GOLD = (245, 194, 64, 255)
UI_INK = (3, 10, 20, 255)
WHITE = (245, 250, 255, 255)


def main() -> None:
    if OUT.exists():
        shutil.rmtree(OUT)

    for folder in [
        OUT / "backgrounds",
        OUT / "sprites" / "fish",
        OUT / "sprites" / "ambient",
        OUT / "equipment",
        OUT / "ui",
        OUT / "vfx",
        OUT / "audio",
        OUT / "atlases",
    ]:
        folder.mkdir(parents=True, exist_ok=True)

    generated: list[dict[str, str]] = []
    generated.extend(generate_backgrounds())
    generated.extend(generate_fish())
    generated.extend(generate_ambient())
    generated.extend(generate_equipment())
    generated.extend(generate_ui())
    generated.extend(generate_vfx())
    generated.extend(generate_audio())
    generated.extend(pack_atlas())
    write_manifest(generated)
    write_asset_register(generated)


def generate_backgrounds() -> list[dict[str, str]]:
    entries: list[dict[str, str]] = []
    zones = [
        ("zone1", (50, 190, 235), (0, 94, 174), (249, 110, 104)),
        ("zone2", (42, 178, 218), (0, 82, 152), (204, 73, 153)),
        ("zone3", (32, 139, 207), (8, 51, 125), (246, 189, 68)),
    ]
    layers = ["sky", "water", "midground", "encounter", "foreground"]
    for zone_index, (zone, sky_color, water_color, accent) in enumerate(zones):
        for layer_index, layer in enumerate(layers):
            image = Image.new("RGBA", (1600, 900), (0, 0, 0, 0))
            draw = ImageDraw.Draw(image, "RGBA")
            if layer == "sky":
                vertical_gradient(draw, 1600, 900, sky_color, (186, 240, 252), 0, 530)
                draw_cloud(draw, 210 + zone_index * 55, 170, 1.05)
                draw_cloud(draw, 1180 - zone_index * 40, 120, 0.9)
                draw_island(draw, 120 + zone_index * 18, 470, accent)
                draw_island(draw, 1240 - zone_index * 24, 460, (84, 178, 112))
            elif layer == "water":
                vertical_gradient(draw, 1600, 900, (40, 188, 222), water_color, 330, 900)
                for y in range(360, 890, 28):
                    for x in range(-80, 1680, 150):
                        alpha = 42 if y < 600 else 24
                        draw.arc((x, y, x + 95, y + 22), 190, 350, fill=(196, 246, 255, alpha), width=2)
                for x in range(0, 1600, 42):
                    y = 560 + math.sin((x + zone_index * 30) / 80) * 18
                    draw.line((x, y, x + 32, y + 3), fill=(16, 114, 184, 80), width=2)
            elif layer == "midground":
                for index in range(12):
                    x = 110 + index * 126
                    y = 515 + math.sin(index + zone_index) * 45
                    draw_fish_silhouette(draw, x, y, 0.4 + (index % 3) * 0.08, (4, 46, 84, 72))
                draw_lighthouse(draw, 220 + zone_index * 28, 365)
            elif layer == "encounter":
                draw_rod_hint(draw, 120, 780, zone_index)
                for x in range(760, 940, 18):
                    draw.ellipse((x, 535 + math.sin(x / 20) * 8, x + 5, 540 + math.sin(x / 20) * 8), fill=(228, 255, 255, 92))
            elif layer == "foreground":
                for x in range(-40, 1680, 96):
                    y = 840 + math.sin((x + zone_index * 100) / 90) * 16
                    draw.arc((x, y, x + 120, y + 34), 185, 350, fill=(224, 253, 255, 90), width=4)
                for index in range(9):
                    draw_coral(draw, 70 + index * 178, 858, accent, 0.8 + (index % 4) * 0.12)

            filename = f"bg_shallow_coast_{zone}_{layer}.webp"
            path = OUT / "backgrounds" / filename
            image.save(path, "WEBP", quality=88, method=6)
            entries.append(asset_entry(path, "background", "Generated Shallow Coast parallax layer"))

    weather = Image.new("RGBA", (1600, 900), (0, 0, 0, 0))
    draw = ImageDraw.Draw(weather, "RGBA")
    vertical_gradient(draw, 1600, 900, (255, 206, 118), (20, 122, 180), 0, 900)
    for x in range(0, 1600, 52):
        draw.line((x, 0, x - 150, 900), fill=(255, 255, 255, 28), width=2)
    path = OUT / "backgrounds" / "bg_shallow_coast_weather_dawn.webp"
    weather.save(path, "WEBP", quality=86, method=6)
    entries.append(asset_entry(path, "background", "Generated dawn weather overlay"))

    route = Image.new("RGBA", (1200, 720), (12, 43, 78, 255))
    draw = ImageDraw.Draw(route, "RGBA")
    vertical_gradient(draw, 1200, 720, (38, 168, 208), (4, 45, 102), 0, 720)
    points = [(180, 500), (430, 405), (650, 315), (850, 245), (1030, 170)]
    for left, right in zip(points, points[1:]):
        draw.line((left, right), fill=(245, 194, 64, 220), width=8)
    for index, (x, y) in enumerate(points):
        draw.ellipse((x - 28, y - 28, x + 28, y + 28), fill=UI_NAVY, outline=UI_BORDER, width=4)
        draw.text((x - 7, y - 10), str(index + 1), fill=WHITE)
    path = OUT / "backgrounds" / "bg_shallow_coast_route_map.webp"
    route.save(path, "WEBP", quality=88, method=6)
    entries.append(asset_entry(path, "background", "Generated Shallow Coast route map"))
    return entries


def generate_fish() -> list[dict[str, str]]:
    entries: list[dict[str, str]] = []
    for species, rarity, primary, secondary, motif in SPECIES:
        frame_count = COMMON_FRAME_COUNT if rarity == "common" else RARE_FRAME_COUNT
        size = (280, 180) if rarity == "boss" else (160, 108)
        for state in FISH_STATES:
            for frame in range(frame_count):
                image = draw_fish_frame(species, rarity, primary, secondary, motif, state, frame, frame_count, size)
                filename = f"fish_{species}_{state}_{frame}.png"
                path = OUT / "sprites" / "fish" / filename
                image.save(path)
                entries.append(asset_entry(path, "fish", f"Generated {species} {state} animation frame"))
    return entries


def generate_ambient() -> list[dict[str, str]]:
    entries: list[dict[str, str]] = []
    ambient_specs = [
        ("school", (14, 74, 112, 120)),
        ("shadow", (1, 23, 45, 120)),
        ("bubbles", (220, 252, 255, 160)),
    ]
    for name, color in ambient_specs:
        image = Image.new("RGBA", (220, 120), (0, 0, 0, 0))
        draw = ImageDraw.Draw(image, "RGBA")
        if name == "bubbles":
            for index in range(14):
                x = 20 + (index * 17) % 180
                y = 20 + (index * 29) % 80
                draw.ellipse((x, y, x + 10, y + 10), outline=color, width=2)
        else:
            for index in range(10):
                draw_fish_silhouette(draw, 30 + index * 17, 40 + math.sin(index) * 16, 0.32, color)
        filename = f"fish_ambient_{name}_idle_0.png"
        path = OUT / "sprites" / "ambient" / filename
        image.save(path)
        entries.append(asset_entry(path, "ambient", f"Generated ambient {name} silhouette"))
    return entries


def generate_equipment() -> list[dict[str, str]]:
    entries: list[dict[str, str]] = []
    items = [
        ("ui_equipment_boat_default.png", "boat"),
        ("ui_equipment_rod_bamboo.png", "rod_bamboo"),
        ("ui_equipment_rod_tideglass.png", "rod_tideglass"),
        ("ui_equipment_line_braided.png", "line_braided"),
        ("ui_equipment_line_luminous.png", "line_luminous"),
        ("ui_equipment_bait_shell.png", "bait_shell"),
        ("ui_equipment_bait_moon.png", "bait_moon"),
        ("ui_equipment_bait_coral.png", "bait_coral"),
        ("ui_equipment_net_default.png", "net"),
    ]
    for filename, kind in items:
        image = Image.new("RGBA", (128, 128), (0, 0, 0, 0))
        draw = ImageDraw.Draw(image, "RGBA")
        if kind == "boat":
            draw.rounded_rectangle((16, 58, 112, 92), radius=16, fill=(121, 70, 38, 255), outline=UI_INK, width=4)
            draw.polygon([(34, 58), (92, 58), (78, 36), (48, 36)], fill=(225, 196, 129, 255), outline=UI_INK)
        elif "rod" in kind:
            draw.line((28, 104, 102, 18), fill=(136, 79, 40, 255), width=8)
            draw.line((34, 104, 108, 18), fill=(246, 201, 83, 255), width=2)
            draw.arc((84, 14, 116, 44), 270, 90, fill=(210, 236, 246, 255), width=3)
        elif "line" in kind:
            color = (210, 244, 250, 255) if "luminous" in kind else (222, 231, 231, 255)
            for offset in range(26, 104, 18):
                draw.arc((offset, 16, offset + 42, 112), 90, 270, fill=color, width=4)
        elif "bait" in kind:
            fill = UI_GOLD if "moon" in kind else (238, 108, 128, 255) if "coral" in kind else (131, 222, 178, 255)
            draw.ellipse((33, 28, 95, 92), fill=fill, outline=UI_INK, width=4)
            draw.arc((54, 14, 98, 60), 120, 260, fill=WHITE, width=4)
        elif kind == "net":
            draw.ellipse((28, 28, 100, 88), outline=WHITE, width=4)
            for x in range(36, 96, 14):
                draw.line((x, 32, x - 20, 88), fill=(190, 225, 232, 180), width=2)
            draw.line((78, 82, 112, 112), fill=(137, 80, 44, 255), width=8)
        path = OUT / "equipment" / filename
        image.save(path)
        entries.append(asset_entry(path, "equipment", f"Generated {kind} equipment asset"))
    return entries


def generate_ui() -> list[dict[str, str]]:
    entries: list[dict[str, str]] = []
    panels = {
        "ui_typing_panel_default.png": (720, 150, "TYPING"),
        "ui_meter_tension_default.png": (520, 44, "TENSION"),
        "ui_meter_durability_default.png": (320, 36, "DURABILITY"),
        "ui_meter_combo_default.png": (220, 72, "COMBO"),
        "ui_meter_skill_energy_default.png": (260, 36, "SKILL"),
        "ui_collection_card_default.png": (250, 340, "COLLECTION"),
        "ui_reward_panel_default.png": (420, 260, "REWARD"),
        "ui_result_panel_default.png": (460, 300, "RESULT"),
        "ui_keyboard_settings_default.png": (520, 360, "SETTINGS"),
    }
    for filename, (width, height, label) in panels.items():
        image = draw_panel(width, height, label)
        path = OUT / "ui" / filename
        image.save(path)
        entries.append(asset_entry(path, "ui", f"Generated UI chrome for {label.lower()}"))

    for filename, color in [
        ("ui_text_default.png", WHITE),
        ("ui_text_correct.png", (143, 238, 121, 255)),
        ("ui_text_typo.png", (255, 88, 96, 255)),
        ("ui_text_cursor.png", UI_GOLD),
    ]:
        image = Image.new("RGBA", (64, 64), (0, 0, 0, 0))
        draw = ImageDraw.Draw(image, "RGBA")
        draw.rounded_rectangle((12, 18, 52, 46), radius=8, fill=color, outline=UI_INK, width=3)
        path = OUT / "ui" / filename
        image.save(path)
        entries.append(asset_entry(path, "ui", "Generated typing text state marker"))

    for rarity, color in [
        ("common", (115, 227, 154, 255)),
        ("uncommon", (88, 222, 218, 255)),
        ("rare", (213, 101, 240, 255)),
        ("boss", (245, 194, 64, 255)),
    ]:
        image = draw_panel(240, 240, rarity.upper(), border=color)
        path = OUT / "ui" / f"ui_rarity_frame_{rarity}.png"
        image.save(path)
        entries.append(asset_entry(path, "ui", f"Generated {rarity} rarity frame"))

    route_states = ["locked", "available", "selected", "cleared"]
    for state in route_states:
        image = Image.new("RGBA", (90, 90), (0, 0, 0, 0))
        draw = ImageDraw.Draw(image, "RGBA")
        fill = UI_NAVY if state != "cleared" else (22, 83, 62, 245)
        border = UI_GOLD if state == "selected" else UI_BORDER
        draw.ellipse((10, 10, 80, 80), fill=fill, outline=border, width=5)
        if state == "cleared":
            draw.line((30, 47, 43, 60, 64, 31), fill=WHITE, width=6)
        path = OUT / "ui" / f"ui_route_node_{state}.png"
        image.save(path)
        entries.append(asset_entry(path, "ui", f"Generated route node {state}"))

    skill_icons = [
        ("cast_net", "net"),
        ("steel_line", "line"),
        ("sonar", "ping"),
        ("calm_current", "wave"),
        ("perfect_bait", "bait"),
        ("reel_mastery", "reel"),
    ]
    for skill, symbol in skill_icons:
        image = draw_icon(symbol)
        path = OUT / "ui" / f"ui_skill_{skill}_default.png"
        image.save(path)
        entries.append(asset_entry(path, "ui", f"Generated {skill} skill icon"))
    return entries


def generate_vfx() -> list[dict[str, str]]:
    entries: list[dict[str, str]] = []
    variants = {
        "soft_circle": draw_vfx_soft_circle,
        "sharp_spark": draw_vfx_sharp_spark,
        "bubble": draw_vfx_bubble,
        "foam_droplet": draw_vfx_foam,
        "water_streak": draw_vfx_streak,
        "glow_ring": draw_vfx_ring,
        "smoke_cloud": draw_vfx_cloud,
        "tension_line": draw_vfx_tension,
    }
    for name, fn in variants.items():
        image = fn()
        path = OUT / "vfx" / f"vfx_{name}_default.png"
        image.save(path)
        entries.append(asset_entry(path, "vfx", f"Generated grayscale VFX texture {name}"))
    return entries


def generate_audio() -> list[dict[str, str]]:
    entries: list[dict[str, str]] = []
    specs = [
        ("sfx_correct_tick_a.ogg", 880, 0.06),
        ("sfx_correct_tick_b.ogg", 990, 0.055),
        ("sfx_word_complete_a.ogg", 660, 0.16),
        ("sfx_word_complete_b.ogg", 740, 0.14),
        ("sfx_combo_milestone_a.ogg", 1040, 0.22),
        ("sfx_combo_milestone_b.ogg", 1240, 0.22),
        ("sfx_typo_thud_a.ogg", 150, 0.12),
        ("sfx_typo_thud_b.ogg", 110, 0.13),
        ("sfx_line_tension_a.ogg", 260, 0.2),
        ("sfx_line_tension_b.ogg", 290, 0.18),
        ("sfx_line_critical_a.ogg", 190, 0.35),
        ("sfx_skill_ready_a.ogg", 940, 0.28),
        ("sfx_skill_activate_a.ogg", 520, 0.22),
        ("sfx_cast_net_a.ogg", 380, 0.28),
        ("sfx_rare_sting_a.ogg", 760, 0.45),
        ("sfx_catch_impact_a.ogg", 220, 0.32),
        ("sfx_reward_sting_a.ogg", 920, 0.5),
        ("sfx_escape_snap_a.ogg", 120, 0.25),
        ("sfx_splash_a.ogg", 330, 0.2),
        ("sfx_splash_b.ogg", 365, 0.22),
        ("sfx_ambient_ocean_loop.ogg", 120, 4.0),
        ("sfx_music_expedition_loop.ogg", 220, 6.0),
        ("sfx_music_boss_layer.ogg", 90, 6.0),
    ]
    for filename, frequency, duration in specs:
        path = OUT / "audio" / filename
        write_ogg_tone(path, frequency, duration, loop="loop" in filename or "music" in filename)
        entries.append(asset_entry(path, "audio", f"Generated synthesized audio cue {filename}"))
    return entries


def pack_atlas() -> list[dict[str, str]]:
    source_dirs = [OUT / "sprites", OUT / "equipment", OUT / "ui", OUT / "vfx"]
    files = [path for source_dir in source_dirs for path in source_dir.rglob("*.png")]
    images = [(path, Image.open(path).convert("RGBA")) for path in sorted(files)]
    max_width = 4096
    padding = 4
    x = padding
    y = padding
    row_height = 0
    frames: dict[str, dict[str, object]] = {}
    placements: list[tuple[Path, Image.Image, int, int]] = []

    for path, image in images:
        width, height = image.size
        if x + width + padding > max_width:
            x = padding
            y += row_height + padding
            row_height = 0
        placements.append((path, image, x, y))
        frame_name = path.name
        frames[frame_name] = {
            "frame": {"x": x, "y": y, "w": width, "h": height},
            "rotated": False,
            "trimmed": False,
            "spriteSourceSize": {"x": 0, "y": 0, "w": width, "h": height},
            "sourceSize": {"w": width, "h": height},
        }
        x += width + padding
        row_height = max(row_height, height)

    atlas_height = next_power_of_two(y + row_height + padding)
    atlas = Image.new("RGBA", (max_width, atlas_height), (0, 0, 0, 0))
    for _, image, px, py in placements:
        atlas.alpha_composite(image, (px, py))

    atlas_path = OUT / "atlases" / "atlas_ocean.png"
    atlas.save(atlas_path)
    json_path = OUT / "atlases" / "atlas_ocean.json"
    json_path.write_text(
        json.dumps(
            {
                "frames": frames,
                "meta": {
                    "app": "typecade procedural asset generator",
                    "image": "atlas_ocean.png",
                    "format": "RGBA8888",
                    "size": {"w": max_width, "h": atlas_height},
                    "scale": "1",
                },
            },
            indent=2,
        ),
        encoding="utf-8",
    )
    return [
        asset_entry(atlas_path, "atlas", "Generated Phaser texture atlas image"),
        asset_entry(json_path, "atlas", "Generated Phaser texture atlas metadata"),
    ]


def draw_fish_frame(
    species: str,
    rarity: str,
    primary: tuple[int, int, int],
    secondary: tuple[int, int, int],
    motif: str,
    state: str,
    frame: int,
    frame_count: int,
    size: tuple[int, int],
) -> Image.Image:
    width, height = size
    image = Image.new("RGBA", size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(image, "RGBA")
    phase = frame / frame_count * math.tau
    tail = math.sin(phase) * 10
    squash = 1.0
    if state == "struggle":
        tail *= 1.65
        squash = 0.94 + abs(math.sin(phase)) * 0.12
    if state == "stunned":
        tail *= 0.25
    if state == "caught":
        tail *= 0.5
    scale = 1.55 if rarity == "boss" else 1
    cx, cy = width * 0.54, height * 0.5
    body_w, body_h = width * 0.54, height * 0.38 * squash
    outline = (4, 11, 25, 255)
    glow = (primary[0], primary[1], primary[2], 58)

    if rarity in {"rare", "boss", "uncommon"}:
        draw.ellipse((cx - body_w * 0.74, cy - body_h * 0.68, cx + body_w * 0.72, cy + body_h * 0.7), fill=glow)

    tail_points = [
        (cx - body_w * 0.48, cy),
        (cx - body_w * 0.86, cy - body_h * 0.46 - tail),
        (cx - body_w * 0.74, cy),
        (cx - body_w * 0.86, cy + body_h * 0.46 - tail),
    ]
    draw.polygon(tail_points, fill=(*secondary, 255), outline=outline)
    draw.ellipse(
        (cx - body_w * 0.5, cy - body_h * 0.5, cx + body_w * 0.5, cy + body_h * 0.5),
        fill=(*primary, 255),
        outline=outline,
        width=max(3, int(4 * scale)),
    )
    draw.polygon(
        [(cx - body_w * 0.05, cy - body_h * 0.34), (cx + body_w * 0.1, cy - body_h * 0.76), (cx + body_w * 0.24, cy - body_h * 0.32)],
        fill=(*secondary, 230),
        outline=outline,
    )
    draw.polygon(
        [(cx - body_w * 0.05, cy + body_h * 0.26), (cx + body_w * 0.17, cy + body_h * 0.7), (cx + body_w * 0.3, cy + body_h * 0.2)],
        fill=(*secondary, 220),
        outline=outline,
    )
    draw.ellipse((cx + body_w * 0.24, cy - body_h * 0.18, cx + body_w * 0.38, cy - body_h * 0.04), fill=WHITE, outline=outline, width=2)
    draw.ellipse((cx + body_w * 0.3, cy - body_h * 0.14, cx + body_w * 0.36, cy - body_h * 0.08), fill=UI_INK)

    if motif == "stripe":
        for offset in [-0.18, 0.02, 0.22]:
            draw.arc((cx + body_w * offset, cy - body_h * 0.45, cx + body_w * (offset + 0.24), cy + body_h * 0.44), 94, 266, fill=(255, 255, 255, 130), width=3)
    elif motif == "spot":
        for index in range(5):
            draw.ellipse((cx - body_w * 0.18 + index * 13, cy - 10 + math.sin(index) * 10, cx - body_w * 0.12 + index * 13, cy - 4 + math.sin(index) * 10), fill=(255, 248, 160, 190))
    elif motif == "armor":
        for offset in [-0.28, -0.1, 0.08, 0.26]:
            draw.line((cx + body_w * offset, cy - body_h * 0.36, cx + body_w * (offset + 0.08), cy + body_h * 0.36), fill=(10, 40, 46, 150), width=3)
    elif motif == "moon":
        for index in range(10):
            angle = index * 0.9
            draw.ellipse((cx - 35 + math.cos(angle) * 42, cy - 16 + math.sin(angle) * 20, cx - 29 + math.cos(angle) * 42, cy - 10 + math.sin(angle) * 20), fill=(255, 213, 245, 220))
    elif motif == "glass":
        draw.line((cx - body_w * 0.34, cy, cx + body_w * 0.28, cy), fill=(255, 255, 255, 150), width=3)
    elif motif == "shark":
        draw.polygon([(cx + body_w * 0.02, cy - body_h * 0.5), (cx + body_w * 0.16, cy - body_h * 0.95), (cx + body_w * 0.32, cy - body_h * 0.38)], fill=(*secondary, 255), outline=outline)
    elif motif == "crown":
        crown_y = cy - body_h * 0.58
        draw.polygon(
            [
                (cx + body_w * 0.02, crown_y),
                (cx + body_w * 0.12, crown_y - 22),
                (cx + body_w * 0.2, crown_y),
                (cx + body_w * 0.31, crown_y - 28),
                (cx + body_w * 0.42, crown_y),
            ],
            fill=UI_GOLD,
            outline=outline,
        )

    if state == "stunned":
        draw.line((cx + body_w * 0.14, cy - body_h * 0.48, cx + body_w * 0.34, cy - body_h * 0.64), fill=UI_GOLD, width=4)
    if state == "bite":
        draw.arc((cx + body_w * 0.34, cy - 2, cx + body_w * 0.58, cy + body_h * 0.24), 20, 160, fill=WHITE, width=3)
    if state == "escape":
        image = image.filter(ImageFilter.GaussianBlur(radius=0.6))

    angle = 0
    if state == "struggle":
        angle = math.sin(phase) * 5
    if state == "caught":
        angle = -8
    if state == "escape":
        angle = 6
    if angle:
        image = image.rotate(angle, resample=Image.Resampling.BICUBIC, expand=False)
    return image


def draw_panel(width: int, height: int, label: str, border: tuple[int, int, int, int] = UI_BORDER) -> Image.Image:
    image = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    draw = ImageDraw.Draw(image, "RGBA")
    draw.rounded_rectangle((4, 4, width - 4, height - 4), radius=14, fill=UI_NAVY, outline=UI_INK, width=5)
    draw.rounded_rectangle((10, 10, width - 10, height - 10), radius=10, outline=border, width=3)
    draw.line((18, height - 17, width - 18, height - 17), fill=(255, 255, 255, 55), width=2)
    draw.text((22, 18), label, fill=WHITE)
    return image


def draw_icon(symbol: str) -> Image.Image:
    image = draw_panel(96, 96, "")
    draw = ImageDraw.Draw(image, "RGBA")
    if symbol == "net":
        draw.ellipse((26, 24, 70, 60), outline=WHITE, width=4)
        draw.line((58, 56, 76, 76), fill=UI_GOLD, width=5)
    elif symbol == "line":
        draw.line((28, 72, 68, 24), fill=WHITE, width=5)
        draw.line((32, 72, 72, 24), fill=UI_GOLD, width=2)
    elif symbol == "ping":
        for radius in [12, 22, 32]:
            draw.ellipse((48 - radius, 48 - radius, 48 + radius, 48 + radius), outline=(121, 229, 236, 180), width=3)
        draw.ellipse((43, 43, 53, 53), fill=UI_GOLD)
    elif symbol == "wave":
        for y in [38, 50, 62]:
            draw.arc((20, y - 16, 60, y + 14), 190, 345, fill=(98, 224, 214, 255), width=4)
    elif symbol == "bait":
        draw.ellipse((33, 26, 63, 60), fill=UI_GOLD, outline=UI_INK, width=3)
        draw.arc((42, 13, 72, 44), 120, 250, fill=WHITE, width=4)
    elif symbol == "reel":
        draw.ellipse((28, 28, 68, 68), outline=WHITE, width=5)
        draw.ellipse((42, 42, 54, 54), fill=UI_GOLD)
        draw.line((60, 60, 76, 76), fill=UI_GOLD, width=5)
    return image


def draw_vfx_soft_circle() -> Image.Image:
    image = Image.new("RGBA", (64, 64), (0, 0, 0, 0))
    draw = ImageDraw.Draw(image, "RGBA")
    for radius in range(30, 0, -2):
        alpha = int(180 * (1 - radius / 34))
        draw.ellipse((32 - radius, 32 - radius, 32 + radius, 32 + radius), fill=(255, 255, 255, alpha))
    return image.filter(ImageFilter.GaussianBlur(radius=2))


def draw_vfx_sharp_spark() -> Image.Image:
    image = Image.new("RGBA", (64, 64), (0, 0, 0, 0))
    draw = ImageDraw.Draw(image, "RGBA")
    draw.polygon([(32, 3), (38, 27), (61, 32), (38, 37), (32, 61), (26, 37), (3, 32), (26, 27)], fill=(255, 255, 255, 230))
    return image


def draw_vfx_bubble() -> Image.Image:
    image = Image.new("RGBA", (64, 64), (0, 0, 0, 0))
    draw = ImageDraw.Draw(image, "RGBA")
    draw.ellipse((12, 12, 52, 52), outline=(255, 255, 255, 210), width=4)
    draw.arc((22, 18, 42, 36), 200, 320, fill=(255, 255, 255, 170), width=2)
    return image


def draw_vfx_foam() -> Image.Image:
    image = Image.new("RGBA", (64, 64), (0, 0, 0, 0))
    draw = ImageDraw.Draw(image, "RGBA")
    draw.ellipse((22, 12, 45, 50), fill=(255, 255, 255, 220))
    draw.ellipse((18, 42, 50, 60), fill=(255, 255, 255, 120))
    return image


def draw_vfx_streak() -> Image.Image:
    image = Image.new("RGBA", (96, 32), (0, 0, 0, 0))
    draw = ImageDraw.Draw(image, "RGBA")
    draw.line((4, 18, 90, 8), fill=(255, 255, 255, 210), width=5)
    draw.line((14, 25, 78, 19), fill=(255, 255, 255, 90), width=3)
    return image


def draw_vfx_ring() -> Image.Image:
    image = Image.new("RGBA", (96, 96), (0, 0, 0, 0))
    draw = ImageDraw.Draw(image, "RGBA")
    draw.ellipse((12, 12, 84, 84), outline=(255, 255, 255, 220), width=6)
    draw.ellipse((25, 25, 71, 71), outline=(255, 255, 255, 70), width=3)
    return image


def draw_vfx_cloud() -> Image.Image:
    image = Image.new("RGBA", (96, 72), (0, 0, 0, 0))
    draw = ImageDraw.Draw(image, "RGBA")
    for oval in [(4, 28, 42, 60), (22, 10, 72, 56), (52, 26, 94, 64), (16, 34, 82, 70)]:
        draw.ellipse(oval, fill=(255, 255, 255, 105))
    return image.filter(ImageFilter.GaussianBlur(radius=2))


def draw_vfx_tension() -> Image.Image:
    image = Image.new("RGBA", (128, 32), (0, 0, 0, 0))
    draw = ImageDraw.Draw(image, "RGBA")
    points = []
    for x in range(0, 128, 8):
        points.append((x, 16 + math.sin(x / 8) * 9))
    draw.line(points, fill=(255, 255, 255, 235), width=4)
    return image


def write_ogg_tone(path: Path, frequency: int, duration: float, loop: bool = False) -> None:
    sample_rate = 44100
    wav_path = path.with_suffix(".wav")
    frames = int(sample_rate * duration)
    with wave.open(str(wav_path), "w") as handle:
        handle.setnchannels(1)
        handle.setsampwidth(2)
        handle.setframerate(sample_rate)
        for index in range(frames):
            t = index / sample_rate
            envelope = 1.0 if loop else min(1.0, index / max(1, sample_rate * 0.02)) * max(0.0, 1 - index / frames)
            value = math.sin(math.tau * frequency * t) * envelope * 0.25
            if "ambient" in path.name:
                value += math.sin(math.tau * (frequency * 0.5) * t) * 0.08
            handle.writeframesraw(int(value * 32767).to_bytes(2, byteorder="little", signed=True))
    subprocess.run(
        ["ffmpeg", "-y", "-loglevel", "error", "-i", str(wav_path), "-codec:a", "libvorbis", str(path)],
        check=True,
    )
    wav_path.unlink(missing_ok=True)


def write_manifest(entries: list[dict[str, str]]) -> None:
    manifest = {
        "version": "ocean-m1-2026-08-17",
        "atlas": {
            "image": "/assets/ocean/atlases/atlas_ocean.png",
            "json": "/assets/ocean/atlases/atlas_ocean.json",
        },
        "backgrounds": sorted(str(path.relative_to(OUT).as_posix()) for path in (OUT / "backgrounds").glob("*.webp")),
        "audio": sorted(str(path.relative_to(OUT).as_posix()) for path in (OUT / "audio").glob("*.ogg")),
        "assets": sorted(entries, key=lambda item: item["path"]),
    }
    (OUT / "manifest.json").write_text(json.dumps(manifest, indent=2), encoding="utf-8")


def write_asset_register(entries: list[dict[str, str]]) -> None:
    rows = [
        "# Asset Licenses",
        "",
        "This register covers the Ocean Typing RPG Milestone 0/1 asset set generated for this branch.",
        "",
        "| Asset | Source | Creator | License | Attribution | Modification | Used In |",
        "| --- | --- | --- | --- | --- | --- | --- |",
        "| docs/reference/typecade-ui-reference.jpg | User-provided reference screenshot | User | Project reference only | Not redistributed as game asset | Not used as source material; used for UI chrome interpretation | docs/reference |",
        "| .asset-sources/kenney_fish-pack_2.zip | https://kenney.nl/assets/fish-pack | Kenney | CC0 1.0 Universal | Not required | Allowed; used as fallback shape reference and QA target | Procedural asset workflow |",
    ]
    for entry in sorted(entries, key=lambda item: item["path"]):
        rows.append(
            f"| {entry['path']} | Generated locally by scripts/generate_ocean_assets.py from docs/art-bible.md; Kenney CC0 fallback available | Typecade/Codex procedural generator | Project-owned generated asset; Kenney fallback source is CC0 where referenced | None required | Allowed | {entry['usage']} |"
        )
    rows.append("")
    rows.append("Generation prompt: stylized 2D fantasy-ocean fishing typing game, dark navy/gold rounded UI chrome, cyan/teal water, coral/magenta reef accents, readable near-black and white typing states, consistent fish state frames named per docs/game-design(new).md section 15.3.")
    (ROOT / "ASSET-LICENSES.md").write_text("\n".join(rows), encoding="utf-8")


def asset_entry(path: Path, usage: str, note: str) -> dict[str, str]:
    return {
        "path": str(path.relative_to(ROOT).as_posix()),
        "usage": usage,
        "note": note,
    }


def vertical_gradient(draw: ImageDraw.ImageDraw, width: int, height: int, top: tuple[int, int, int], bottom: tuple[int, int, int], y0: int, y1: int) -> None:
    for y in range(y0, y1):
        amount = (y - y0) / max(1, y1 - y0)
        color = tuple(int(top[i] * (1 - amount) + bottom[i] * amount) for i in range(3))
        draw.line((0, y, width, y), fill=(*color, 255))


def draw_cloud(draw: ImageDraw.ImageDraw, x: float, y: float, scale: float) -> None:
    color = (244, 253, 255, 218)
    for dx, dy, radius in [(-60, 10, 38), (-20, -15, 48), (25, 0, 44), (68, 18, 34)]:
        draw.ellipse((x + dx * scale - radius, y + dy * scale - radius, x + dx * scale + radius, y + dy * scale + radius), fill=color)


def draw_island(draw: ImageDraw.ImageDraw, x: float, y: float, accent: tuple[int, int, int]) -> None:
    draw.polygon([(x - 120, y), (x - 40, y - 52), (x + 80, y - 40), (x + 150, y)], fill=(62, 143, 99, 255))
    draw.polygon([(x - 150, y), (x + 170, y), (x + 120, y + 32), (x - 120, y + 35)], fill=(206, 172, 112, 255))
    draw.rectangle((x - 12, y - 120, x + 18, y - 32), fill=(235, 245, 244, 255), outline=UI_INK)
    draw.polygon([(x - 24, y - 120), (x + 4, y - 150), (x + 32, y - 120)], fill=accent, outline=UI_INK)


def draw_lighthouse(draw: ImageDraw.ImageDraw, x: float, y: float) -> None:
    draw.rectangle((x - 10, y - 86, x + 12, y), fill=(232, 245, 242, 160))
    draw.polygon([(x - 22, y - 86), (x + 2, y - 116), (x + 26, y - 86)], fill=(246, 110, 96, 170))


def draw_fish_silhouette(draw: ImageDraw.ImageDraw, x: float, y: float, scale: float, color: tuple[int, int, int, int]) -> None:
    draw.ellipse((x - 28 * scale, y - 12 * scale, x + 28 * scale, y + 12 * scale), fill=color)
    draw.polygon([(x - 26 * scale, y), (x - 48 * scale, y - 16 * scale), (x - 42 * scale, y), (x - 48 * scale, y + 16 * scale)], fill=color)


def draw_rod_hint(draw: ImageDraw.ImageDraw, x: float, y: float, zone_index: int) -> None:
    draw.line((x, y, x + 380, y - 420), fill=(57, 33, 20, 165), width=16)
    draw.line((x + 12, y, x + 392, y - 420), fill=(230, 174, 94, 185), width=5)
    draw.line((x + 380, y - 420, 760 + zone_index * 28, 515), fill=(230, 248, 255, 190), width=2)
    draw.ellipse((735 + zone_index * 28, 500, 765 + zone_index * 28, 530), fill=(238, 78, 46, 210), outline=UI_INK)


def draw_coral(draw: ImageDraw.ImageDraw, x: float, y: float, color: tuple[int, int, int], scale: float) -> None:
    for branch in [-20, 0, 20]:
        draw.line((x, y, x + branch * scale, y - (34 + abs(branch)) * scale), fill=(*color, 170), width=max(3, int(5 * scale)))


def next_power_of_two(value: int) -> int:
    power = 1
    while power < value:
        power *= 2
    return power


if __name__ == "__main__":
    main()
