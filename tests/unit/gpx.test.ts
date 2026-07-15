import { describe, expect, it } from "vitest";
import { parseGpxFile, summarizeTracks } from "@/lib/engine/gpx";
import sampleGpx from "../fixtures/sample.gpx?raw";

describe("parseGpxFile", () => {
  it("parses a valid GPX file into a track", () => {
    const parsed = parseGpxFile(sampleGpx);
    expect(parsed.tracks).toHaveLength(1);
    expect(parsed.tracks[0].name).toBe("Sample Track");
    expect(parsed.tracks[0].points).toHaveLength(3);
  });

  it("throws a descriptive error for invalid GPX", () => {
    expect(() => parseGpxFile("not xml at all")).toThrow(/GPXファイルの解析に失敗しました/);
  });

  it("produces a GeoJSON FeatureCollection", () => {
    const parsed = parseGpxFile(sampleGpx);
    const geoJson = parsed.toGeoJSON();
    expect(geoJson.type).toBe("FeatureCollection");
    expect(geoJson.features.length).toBeGreaterThan(0);
  });
});

describe("summarizeTracks", () => {
  it("aggregates distance, elevation, points, and duration across tracks", () => {
    const parsed = parseGpxFile(sampleGpx);
    const summary = summarizeTracks(parsed);

    expect(summary.trackCount).toBe(1);
    expect(summary.pointCount).toBe(3);
    expect(summary.totalDistanceMeters).toBeGreaterThan(0);
    // elevation goes 10 -> 15 -> 8: 5m gain, 7m loss
    expect(summary.elevationGainMeters).toBeCloseTo(5, 0);
    expect(summary.elevationLossMeters).toBeCloseTo(7, 0);
    // three points, 5 minutes apart each = 600 seconds total
    expect(summary.totalDurationSeconds).toBeCloseTo(600, 0);
  });
});
