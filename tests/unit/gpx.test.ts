import { describe, expect, it } from "vitest";
import { parseGpxFile, summarizeTracks, mergeTracks, simplifyTrack } from "@/lib/engine/gpx";
import sampleGpx from "../fixtures/sample.gpx?raw";
import sampleGpx2 from "../fixtures/sample2.gpx?raw";
import denseGpx from "../fixtures/dense.gpx?raw";

describe("parseGpxFile", () => {
  it("parses a valid GPX file into a track", () => {
    const parsed = parseGpxFile(sampleGpx);
    expect(parsed.tracks).toHaveLength(1);
    expect(parsed.tracks[0].name).toBe("Sample Track");
    expect(parsed.tracks[0].points).toHaveLength(3);
  });

  it("throws a descriptive error for invalid GPX", () => {
    expect(() => parseGpxFile("not xml at all")).toThrow(/Failed to parse GPX file/);
  });

  it("produces a GeoJSON FeatureCollection", () => {
    const parsed = parseGpxFile(sampleGpx);
    const geoJson = parsed.toGeoJSON();
    expect(geoJson.type).toBe("FeatureCollection");
    expect(geoJson.features.length).toBeGreaterThan(0);
  });

  it("handles points with no <time> without crashing (regression: gpxjs undefined-vs-null)", () => {
    // dense.gpx has no <time> on any point. gpxjs's removeEmptyFields default
    // deletes an absent <time> to `undefined` rather than `null`, which used
    // to crash calculateDuration inside parseGpxFile before points were
    // normalized back to the documented `Date | null` contract.
    const parsed = parseGpxFile(denseGpx);
    expect(() => summarizeTracks(parsed)).not.toThrow();
    expect(summarizeTracks(parsed).totalDurationSeconds).toBe(0);
  });

  it("handles points with no <ele> without producing NaN elevation", () => {
    const gpxWithoutElevation = `<?xml version="1.0"?>
      <gpx version="1.1" xmlns="http://www.topografix.com/GPX/1/1">
        <trk><name>No Elevation</name><trkseg>
          <trkpt lat="35.0" lon="139.0"></trkpt>
          <trkpt lat="35.001" lon="139.001"></trkpt>
        </trkseg></trk>
      </gpx>`;
    const parsed = parseGpxFile(gpxWithoutElevation);
    const summary = summarizeTracks(parsed);
    expect(summary.elevationGainMeters).not.toBeNaN();
    expect(summary.elevationLossMeters).not.toBeNaN();
    expect(summary.elevationGainMeters).toBeNull();
    expect(summary.elevationLossMeters).toBeNull();
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

describe("mergeTracks", () => {
  it("concatenates points from every file into one track, in order", () => {
    const first = parseGpxFile(sampleGpx);
    const second = parseGpxFile(sampleGpx2);

    const { merged, gpxXml } = mergeTracks({ files: [first, second] });

    expect(merged.tracks).toHaveLength(1);
    expect(merged.tracks[0].points).toHaveLength(5); // 3 + 2
    expect(merged.tracks[0].name).toBe("Merged Track");
    expect(gpxXml).toContain("<gpx");
    expect(gpxXml).toContain("Merged Track");

    // the merged GPX should itself be re-parseable and summarizable
    const reparsed = parseGpxFile(gpxXml);
    const summary = summarizeTracks(reparsed);
    expect(summary.pointCount).toBe(5);
  });

  it("throws when given no files", () => {
    expect(() => mergeTracks({ files: [] })).toThrow(/No GPX files to merge/);
  });
});

describe("simplifyTrack", () => {
  it("keeps every point when tolerance is zero", () => {
    const parsed = parseGpxFile(denseGpx);
    const { simplifiedPointCount, originalPointCount } = simplifyTrack({ parsed, toleranceMeters: 0 });

    expect(originalPointCount).toBe(10);
    expect(simplifiedPointCount).toBe(10);
  });

  it("reduces to just the endpoints at a very large tolerance", () => {
    const parsed = parseGpxFile(denseGpx);
    const { simplifiedPointCount, gpxXml } = simplifyTrack({ parsed, toleranceMeters: 100_000 });

    expect(simplifiedPointCount).toBe(2);
    expect(gpxXml).toContain("Simplified Track");

    // the simplified GPX should itself be re-parseable
    const reparsed = parseGpxFile(gpxXml);
    expect(summarizeTracks(reparsed).pointCount).toBe(2);
  });

  it("reduces the point count at a moderate tolerance without losing the endpoints", () => {
    const parsed = parseGpxFile(denseGpx);
    const original = parsed.tracks[0].points;
    const { simplified, simplifiedPointCount, originalPointCount } = simplifyTrack({
      parsed,
      toleranceMeters: 15,
    });

    expect(simplifiedPointCount).toBeLessThan(originalPointCount);
    expect(simplifiedPointCount).toBeGreaterThanOrEqual(2);
    const points = simplified.tracks[0].points;
    expect(points[0].latitude).toBe(original[0].latitude);
    expect(points[points.length - 1].latitude).toBe(original[original.length - 1].latitude);
  });

  it("throws when there are no points to simplify", () => {
    const parsed = parseGpxFile(sampleGpx);
    parsed.tracks[0].points = [];
    expect(() => simplifyTrack({ parsed, toleranceMeters: 5 })).toThrow(/No points to simplify/);
  });
});
