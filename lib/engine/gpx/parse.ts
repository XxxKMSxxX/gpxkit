import { parseGPX } from "@we-gold/gpxjs";
import type { ParsedGPX } from "@we-gold/gpxjs";

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
    throw new Error(`GPXファイルの解析に失敗しました: ${error.message}`);
  }

  const root = parsed.xml.documentElement;
  if (root === null || root.getElementsByTagName("parsererror").length > 0 || root.tagName === "parsererror") {
    throw new Error("GPXファイルの解析に失敗しました: 不正なXMLです");
  }
  if (root.tagName.toLowerCase() !== "gpx") {
    throw new Error("GPXファイルの解析に失敗しました: <gpx>ルート要素が見つかりません");
  }

  return parsed;
}
