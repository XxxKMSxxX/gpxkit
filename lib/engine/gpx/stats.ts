import type { ParsedGPX, Point } from "@we-gold/gpxjs";

/** Seconds between a track's first and last timestamped points (0 if fewer than 2 are timestamped). */
function trackDurationSeconds(points: Point[]): number {
  const timed = points.filter((p) => p.time !== null);
  if (timed.length < 2) return 0;
  const first = timed[0].time as Date;
  const last = timed[timed.length - 1].time as Date;
  return (last.getTime() - first.getTime()) / 1000;
}

/**
 * Aggregate stats across every track in a parsed GPX file.
 *
 * `@we-gold/gpxjs` already computes distance/elevation per track at parse
 * time (see its internal `calculateDistance`/`calculateElevation` calls), so
 * those are reused directly rather than recomputed — no separate distance
 * library needed.
 *
 * Duration is the one exception: gpxjs's `calculateDuration` builds its
 * timed-points list with a loop bounded by `i < points.length - 1`, which
 * silently drops the last point from the calculation. For a track timestamped
 * every 5 minutes with 3 points, that undercounts `totalDuration` as 300s
 * instead of the correct 600s spanning first-to-last point. Rather than
 * propagate that wrong number, this file derives duration itself directly
 * from the first and last points' own `<time>` values.
 */
export type TrackSummary = {
  totalDistanceMeters: number;
  elevationGainMeters: number | null;
  elevationLossMeters: number | null;
  pointCount: number;
  totalDurationSeconds: number;
  trackCount: number;
};

export function summarizeTracks(parsed: ParsedGPX): TrackSummary {
  const tracks = parsed.tracks;

  let totalDistanceMeters = 0;
  let elevationGainMeters: number | null = null;
  let elevationLossMeters: number | null = null;
  let pointCount = 0;
  let totalDurationSeconds = 0;

  for (const track of tracks) {
    totalDistanceMeters += track.distance.total;
    pointCount += track.points.length;
    totalDurationSeconds += trackDurationSeconds(track.points);

    if (track.elevation.positive !== null) {
      elevationGainMeters = (elevationGainMeters ?? 0) + track.elevation.positive;
    }
    if (track.elevation.negative !== null) {
      // gpxjs reports elevation.negative as a negative or zero number (total descent);
      // normalize to a positive "loss" magnitude for display.
      elevationLossMeters = (elevationLossMeters ?? 0) + Math.abs(track.elevation.negative);
    }
  }

  return {
    totalDistanceMeters,
    elevationGainMeters,
    elevationLossMeters,
    pointCount,
    totalDurationSeconds,
    trackCount: tracks.length,
  };
}
