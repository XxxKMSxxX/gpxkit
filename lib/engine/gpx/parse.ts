import { parseGPX, calculateDistance, calculateDuration, calculateElevation, calculateSlopes } from "@we-gold/gpxjs";
import type { Options, ParsedGPX, Point } from "@we-gold/gpxjs";

const DEFAULT_OPTIONS: Options = { removeEmptyFields: true, avgSpeedThreshold: 2.15e-4 };

/**
 * Parses raw GPX XML text into a structured track.
 *
 * Wraps `@we-gold/gpxjs`'s `[value, error]` tuple return in a thrown error
 * instead, so callers can use plain try/catch and the rest of the engine
 * doesn't need to know about the underlying library's error convention.
 *
 * `@we-gold/gpxjs`'s own error path only fires when its custom XML-parsing
 * method returns `null`, which never happens with the default browser
 * `DOMParser` — invalid XML instead produces a document whose root element
 * is a `<parsererror>` node (the standard DOMParser convention, verified in
 * both jsdom and real browsers), and gpxjs never inspects for that. So we
 * check for it ourselves here rather than trusting the library's tuple to
 * catch malformed input.
 *
 * Note: relies on `window.DOMParser`, so it only runs in a DOM-having
 * environment (browser, or jsdom/happy-dom in tests) — never in plain Node.
 */
export function parseGpxFile(gpxSource: string): ParsedGPX {
  const [parsed, error] = parseGPX(gpxSource);
  if (error !== null) {
    throw new Error(`Failed to parse GPX file: ${error.message}`);
  }

  const root = parsed.xml.documentElement;
  if (root === null || root.getElementsByTagName("parsererror").length > 0 || root.tagName === "parsererror") {
    throw new Error("Failed to parse GPX file: invalid XML");
  }
  if (root.tagName.toLowerCase() !== "gpx") {
    throw new Error("Failed to parse GPX file: missing <gpx> root element");
  }

  // gpxjs's default `removeEmptyFields: true` option deletes a point's
  // `time`/`elevation` outright (leaving them `undefined`) instead of the
  // documented `Date | null` / `number | null` when a <trkpt> has no
  // <time>/<ele>. Its own calculateDuration/calculateElevation helpers only
  // guard against `!== null`, not `undefined` — calculateDuration throws
  // ("Cannot read properties of undefined (reading 'getTime')") and
  // calculateElevation silently produces NaN gain/loss. Normalizing points
  // back to `null` here, then recomputing the track/route-level stats,
  // fixes this once at the parse boundary so every downstream engine
  // function can rely on the documented contract rather than re-guard
  // against `undefined` itself.
  for (const trackOrRoute of [...parsed.tracks, ...parsed.routes]) {
    trackOrRoute.points = trackOrRoute.points.map(normalizePoint);
    trackOrRoute.distance = calculateDistance(trackOrRoute.points);
    trackOrRoute.duration = calculateDuration(trackOrRoute.points, trackOrRoute.distance, DEFAULT_OPTIONS);
    trackOrRoute.elevation = calculateElevation(trackOrRoute.points);
    trackOrRoute.slopes = calculateSlopes(trackOrRoute.points, trackOrRoute.distance.cumulative);
  }
  parsed.waypoints = parsed.waypoints.map(normalizePoint);

  return parsed;
}

function normalizePoint(point: Point): Point {
  return { ...point, time: point.time ?? null, elevation: point.elevation ?? null };
}
