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

export type MergeInput = {
  files: ParsedGPX[];
};

export type MergeResult = {
  /** The merged result, if you need its stats/GeoJSON via the usual helpers. */
  merged: ParsedGPX;
  /** Ready-to-download GPX XML text. */
  gpxXml: string;
};

/**
 * Concatenates every track's points (across every input file, in the order
 * given) into a single continuous track. This is the v1 semantic — points
 * aren't re-sorted or de-duplicated, so merging is really "stitch these
 * tracks together in this order" (e.g. combining a multi-day trip recorded
 * as separate files) rather than a spatial/temporal join.
 */
export function mergeTracks({ files }: MergeInput): MergeResult {
  if (files.length === 0) {
    throw new Error("No GPX files to merge");
  }

  const points: Point[] = files.flatMap((file) => file.tracks.flatMap((track) => track.points));
  if (points.length === 0) {
    throw new Error("None of the tracks contain any points");
  }

  const distance = calculateDistance(points);
  const duration = calculateDuration(points, distance, DEFAULT_OPTIONS);
  const elevation = calculateElevation(points);
  const slopes = calculateSlopes(points, distance.cumulative);

  const mergedTrack: Track = {
    name: "Merged Track",
    comment: null,
    description: null,
    src: null,
    number: null,
    link: [],
    type: null,
    points,
    distance,
    duration,
    elevation,
    slopes,
    extensions: null,
    segmentExtensions: null,
  };

  const first = files[0];
  const merged = new ParsedGPX(
    {
      xml: first.xml,
      metadata: { ...first.metadata, name: "Merged Track" },
      waypoints: [],
      routes: [],
      tracks: [mergedTrack],
      extensions: null,
      version: first.version ?? "1.1",
      creator: "gpxkit",
    },
    DEFAULT_OPTIONS,
  );

  const [gpxXml, error] = stringifyGPX(merged);
  if (error !== null) {
    throw new Error(`Failed to serialize the merged GPX: ${error.message}`);
  }

  return { merged, gpxXml };
}
