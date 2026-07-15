import { useCallback, useMemo, useState } from "react";
import type { ParsedGPX } from "@we-gold/gpxjs";
import { parseGpxFile, summarizeTracks, trimTrack } from "@/lib/engine/gpx";
import FileDropZone from "./FileDropZone";
import MapView from "./MapView";
import TrackStats from "./TrackStats";

export default function TrimClient() {
  const [parsed, setParsed] = useState<ParsedGPX | null>(null);
  const [fileName, setFileName] = useState("");
  const [range, setRange] = useState<[number, number] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const totalPoints = useMemo(
    () => (parsed ? parsed.tracks.flatMap((t) => t.points).length : 0),
    [parsed],
  );

  const handleFiles = useCallback(async ([file]: File[]) => {
    try {
      const text = await file.text();
      const p = parseGpxFile(text);
      const count = p.tracks.flatMap((t) => t.points).length;
      setParsed(p);
      setFileName(file.name);
      setRange([0, Math.max(count - 1, 0)]);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setParsed(null);
      setRange(null);
    }
  }, []);

  const result = useMemo(() => {
    if (!parsed || !range) return null;
    try {
      const [startIndex, endIndex] = range;
      const r = trimTrack({ parsed, startIndex, endIndex });
      return { ...r, geoJson: r.trimmed.toGeoJSON(), summary: summarizeTracks(r.trimmed) };
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      return null;
    }
  }, [parsed, range]);

  const downloadUrl = useMemo(() => {
    if (!result) return null;
    return URL.createObjectURL(new Blob([result.gpxXml], { type: "application/gpx+xml" }));
  }, [result]);

  return (
    <div>
      <FileDropZone onFiles={handleFiles} />

      {error && (
        <p role="alert" style={{ color: "#e63946", marginTop: "1rem" }}>
          {error}
        </p>
      )}

      {parsed && range && (
        <div style={{ marginTop: "1.5rem" }}>
          <p style={{ color: "#666", fontSize: "0.9rem" }}>{fileName}</p>

          <label style={{ display: "block", marginBottom: "0.5rem" }}>
            Start point: {range[0]}
            <input
              type="range"
              min={0}
              max={totalPoints - 1}
              value={range[0]}
              onChange={(e) => setRange([Math.min(Number(e.target.value), range[1]), range[1]])}
              style={{ display: "block", width: "100%", maxWidth: 300 }}
            />
          </label>
          <label style={{ display: "block", marginBottom: "1rem" }}>
            End point: {range[1]}
            <input
              type="range"
              min={0}
              max={totalPoints - 1}
              value={range[1]}
              onChange={(e) => setRange([range[0], Math.max(Number(e.target.value), range[0])])}
              style={{ display: "block", width: "100%", maxWidth: 300 }}
            />
          </label>

          {result && (
            <>
              <p>
                Keeping {result.trimmedPointCount.toLocaleString()} of{" "}
                {result.originalPointCount.toLocaleString()} points
              </p>
              <TrackStats summary={result.summary} />
              {downloadUrl && (
                <a
                  href={downloadUrl}
                  download="trimmed.gpx"
                  style={{ display: "inline-block", marginBottom: "1rem" }}
                >
                  Download trimmed.gpx
                </a>
              )}
              <MapView geoJson={result.geoJson} />
            </>
          )}
        </div>
      )}
    </div>
  );
}
