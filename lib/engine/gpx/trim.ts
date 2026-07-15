import {
  ParsedGPX,
  stringifyGPX,
  calculateDistance,
  calculateDuration,
  calculateElevation,
  calculateSlopes,
} from "@we-gold/gpxjs";
import type { Options, Track } from "@we-gold/gpxjs";

const DEFAULT_OPTIONS: Options = { removeEmptyFields: true, avgSpeedThreshold: 2.15e-4 };

export type TrimInput = {
  parsed: ParsedGPX;
  /** Inclusive start index into the flattened point list. */
  startIndex: number;
  /** Inclusive end index into the flattened point list. */
  endIndex: number;
};

export type TrimResult = {
  trimmed: ParsedGPX;
  gpxXml: string;
  originalPointCount: number;
  trimmedPointCount: number;
};

/**
 * Crops a track down to the inclusive point-index range [startIndex,
 * endIndex] — e.g. to cut off a sensitive segment (like the start/end near
 * home) before sharing a route publicly, without ever sending the full
 * track anywhere first.
 */
export function trimTrack({ parsed, startIndex, endIndex }: TrimInput): TrimResult {
  const points = parsed.tracks.flatMap((track) => track.points);
  if (points.length === 0) {
    throw new Error("No points to trim");
  }
  if (startIndex < 0 || endIndex >= points.length || startIndex > endIndex) {
    throw new Error(`Invalid trim range: [${startIndex}, ${endIndex}] for ${points.length} points`);
  }

  const trimmedPoints = points.slice(startIndex, endIndex + 1);

  const distance = calculateDistance(trimmedPoints);
  const duration = calculateDuration(trimmedPoints, distance, DEFAULT_OPTIONS);
  const elevation = calculateElevation(trimmedPoints);
  const slopes = calculateSlopes(trimmedPoints, distance.cumulative);

  const trimmedTrack: Track = {
    name: "Trimmed Track",
    comment: null,
    description: null,
    src: null,
    number: null,
    link: [],
    type: null,
    points: trimmedPoints,
    distance,
    duration,
    elevation,
    slopes,
    extensions: null,
    segmentExtensions: null,
  };

  const trimmed = new ParsedGPX(
    {
      xml: parsed.xml,
      metadata: { ...parsed.metadata, name: "Trimmed Track" },
      waypoints: [],
      routes: [],
      tracks: [trimmedTrack],
      extensions: null,
      version: parsed.version ?? "1.1",
      creator: "gpxkit",
    },
    DEFAULT_OPTIONS,
  );

  const [gpxXml, error] = stringifyGPX(trimmed);
  if (error !== null) {
    throw new Error(`Failed to serialize the trimmed GPX: ${error.message}`);
  }

  return {
    trimmed,
    gpxXml,
    originalPointCount: points.length,
    trimmedPointCount: trimmedPoints.length,
  };
}
