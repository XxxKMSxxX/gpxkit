"""Generates two synthetic demo GPX files (public/demo/) so GPXKit can be
tried without the user's own data, mirroring ParquetKit's "query a sample
dataset" pattern. Not a recording of a real place — a plausible-looking
loop trail with a realistic elevation profile, used purely as a demo.

Run: uv run scripts/generate_demo_gpx.py
"""

import math
from datetime import datetime, timedelta, timezone
from pathlib import Path

OUT_DIR = Path(__file__).parent.parent / "public" / "demo"

# Roughly a ridge-and-back loop: start low, climb over ~40% of the route,
# ridge walk, descend back down. Centered on an arbitrary point (not a real
# recorded location).
CENTER_LAT = 35.55
CENTER_LON = 138.95
START_TIME = datetime(2026, 5, 3, 6, 30, 0, tzinfo=timezone.utc)
POINT_INTERVAL_SECONDS = 20
WALKING_SPEED_MPS = 1.1  # ~4 km/h


def build_route(n_points: int) -> list[tuple[float, float, float]]:
    """Returns (lat, lon, elevation) tuples tracing a wobbly loop with a climb."""
    points = []
    for i in range(n_points):
        t = i / (n_points - 1)  # 0..1 over the whole route

        # Loop shape: an asymmetric rounded triangle-ish loop via parametric trig,
        # perturbed with a bit of low-frequency noise so it doesn't look too clean.
        angle = t * 2 * math.pi
        radius = 0.028 + 0.006 * math.sin(3 * angle) + 0.002 * math.sin(7 * angle + 1.0)
        lat = CENTER_LAT + radius * math.sin(angle) * 1.0
        lon = CENTER_LON + radius * math.cos(angle) * 1.3

        # Elevation: climb over the first 40%, ridge wobble 40-60%, descend the rest.
        if t < 0.4:
            climb_t = t / 0.4
            ele = 420 + 380 * (climb_t**1.3)
        elif t < 0.6:
            ridge_t = (t - 0.4) / 0.2
            ele = 800 + 25 * math.sin(ridge_t * math.pi * 3)
        else:
            # Descend back down to the same elevation as the start point (420m),
            # since the route is a closed geographic loop (same lat/lon at t=0 and t=1).
            descend_t = (t - 0.6) / 0.4
            ele = 800 - (800 - 420) * (descend_t**0.8)

        points.append((round(lat, 6), round(lon, 6), round(ele, 1)))
    return points


def write_gpx(path: Path, name: str, points: list[tuple[float, float, float]], start_time: datetime):
    lines = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<gpx version="1.1" creator="GPXKit demo generator" xmlns="http://www.topografix.com/GPX/1/1">',
        "  <trk>",
        f"    <name>{name}</name>",
        "    <trkseg>",
    ]
    t = start_time
    for lat, lon, ele in points:
        lines.append(f'      <trkpt lat="{lat}" lon="{lon}">')
        lines.append(f"        <ele>{ele}</ele>")
        lines.append(f'        <time>{t.strftime("%Y-%m-%dT%H:%M:%SZ")}</time>')
        lines.append("      </trkpt>")
        t += timedelta(seconds=POINT_INTERVAL_SECONDS)
    lines.append("    </trkseg>")
    lines.append("  </trk>")
    lines.append("</gpx>")
    lines.append("")
    path.write_text("\n".join(lines), encoding="utf-8")
    print(f"wrote {path} ({len(points)} points)")


def main():
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    full_route = build_route(240)

    # Full loop: the single-file demo for View / Simplify / Trim.
    write_gpx(OUT_DIR / "sample-hike.gpx", "Sample Trail — Ridge Loop", full_route, START_TIME)

    # Same loop split into two consecutive files (with a break in between),
    # so the Merge demo tells a real story: "two recording sessions, same hike".
    midpoint = len(full_route) // 2
    day1 = full_route[:midpoint]
    day2 = full_route[midpoint:]
    day1_start = START_TIME
    day2_start = START_TIME + timedelta(seconds=POINT_INTERVAL_SECONDS * midpoint) + timedelta(minutes=15)

    write_gpx(OUT_DIR / "sample-hike-part1.gpx", "Sample Trail — Ridge Loop (part 1)", day1, day1_start)
    write_gpx(OUT_DIR / "sample-hike-part2.gpx", "Sample Trail — Ridge Loop (part 2)", day2, day2_start)


if __name__ == "__main__":
    main()
