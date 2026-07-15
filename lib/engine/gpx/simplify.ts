import simplify from "@turf/simplify";
import { lineString } from "@turf/helpers";
import {
  ParsedGPX,
  stringifyGPX,
  calculateDistance,
  calculateDuration,
  calculateElevation,
  calculateSlopes,
} from "@we-gold/gpxjs";
import type { Options, Point, Track } from "@we-gold/gpxjs";

const DEFAULT_OPTIONS: Options = { removeEmptyFields: true, avgSpeedThreshold: 2.15e-4 };

/**
 * Approximate meters-per-degree at the equator, used to convert a
 * user-facing "tolerance in meters" into the decimal-degree tolerance
 * `@turf/simplify` expects (it operates directly on lng/lat coordinates,
 * which are degrees, not a distance unit). This ratio shrinks for longitude
 * as latitude increases (converging at the poles), so it under-simplifies
 * slightly at high latitudes — acceptable for a track-simplification tool
 * where the input is the latitudes real GPS recordings are made at, but not
 * a substitute for a true geodesic distance calculation.
 */
const METERS_PER_DEGREE = 111_320;

export type SimplifyInput = {
  parsed: ParsedGPX;
  toleranceMeters: number;
};

export type SimplifyResult = {
  simplified: ParsedGPX;
  gpxXml: string;
  originalPointCount: number;
  simplifiedPointCount: number;
};

export function simplifyTrack({ parsed, toleranceMeters }: SimplifyInput): SimplifyResult {
  const points = parsed.tracks.flatMap((track) => track.points);
  if (points.length === 0) {
    throw new Error("No points to simplify");
  }

  const coords = points.map((p): [number, number] => [p.longitude, p.latitude]);
  const line = lineString(coords);
  const toleranceDegrees = toleranceMeters / METERS_PER_DEGREE;
  const simplifiedLine = simplify(line, { tolerance: toleranceDegrees, highQuality: true });

  const simplifiedPoints = mapSimplifiedPoints(points, simplifiedLine.geometry.coordinates);

  const distance = calculateDistance(simplifiedPoints);
  const duration = calculateDuration(simplifiedPoints, distance, DEFAULT_OPTIONS);
  const elevation = calculateElevation(simplifiedPoints);
  const slopes = calculateSlopes(simplifiedPoints, distance.cumulative);

  const simplifiedTrack: Track = {
    name: "Simplified Track",
    comment: null,
    description: null,
    src: null,
    number: null,
    link: [],
    type: null,
    points: simplifiedPoints,
    distance,
    duration,
    elevation,
    slopes,
    extensions: null,
    segmentExtensions: null,
  };

  const simplified = new ParsedGPX(
    {
      xml: parsed.xml,
      metadata: { ...parsed.metadata, name: "Simplified Track" },
      waypoints: [],
      routes: [],
      tracks: [simplifiedTrack],
      extensions: null,
      version: parsed.version ?? "1.1",
      creator: "gpxkit",
    },
    DEFAULT_OPTIONS,
  );

  const [gpxXml, error] = stringifyGPX(simplified);
  if (error !== null) {
    throw new Error(`Failed to serialize the simplified GPX: ${error.message}`);
  }

  return {
    simplified,
    gpxXml,
    originalPointCount: points.length,
    simplifiedPointCount: simplifiedPoints.length,
  };
}

/**
 * `@turf/simplify` (Douglas-Peucker) only ever keeps a subsequence of the
 * original coordinates — it never interpolates new ones — so each simplified
 * coordinate should exactly match some original point. We walk both arrays
 * in order with a single forward-only pointer (rather than a coordinate
 * lookup Set) so that duplicate coordinates in the original track (e.g. a
 * paused/stationary recording) are matched to the correct occurrence instead
 * of all being kept or all being dropped together.
 */
function mapSimplifiedPoints(original: Point[], simplifiedCoords: number[][]): Point[] {
  const result: Point[] = [];
  let i = 0;
  for (const [lng, lat] of simplifiedCoords) {
    while (i < original.length && !(original[i].longitude === lng && original[i].latitude === lat)) {
      i++;
    }
    if (i >= original.length) {
      throw new Error("Simplification produced a coordinate that doesn't match the original track");
    }
    result.push(original[i]);
    i++;
  }
  return result;
}
