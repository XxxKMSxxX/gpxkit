import { useCallback, useMemo, useState } from "react";
import type { ParsedGPX } from "@we-gold/gpxjs";
import { parseGpxFile, summarizeTracks, simplifyTrack } from "@/lib/engine/gpx";
import FileDropZone from "./FileDropZone";
import MapView from "./MapView";
import TrackStats from "./TrackStats";

const DEFAULT_TOLERANCE_METERS = 10;

export default function SimplifyClient() {
  const [parsed, setParsed] = useState<ParsedGPX | null>(null);
  const [fileName, setFileName] = useState("");
  const [tolerance, setTolerance] = useState(DEFAULT_TOLERANCE_METERS);
  const [error, setError] = useState<string | null>(null);

  const handleFiles = useCallback(async ([file]: File[]) => {
    try {
      const text = await file.text();
      setParsed(parseGpxFile(text));
      setFileName(file.name);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setParsed(null);
    }
  }, []);

  const result = useMemo(() => {
    if (!parsed) return null;
    try {
      const r = simplifyTrack({ parsed, toleranceMeters: tolerance });
      return { ...r, geoJson: r.simplified.toGeoJSON(), summary: summarizeTracks(r.simplified) };
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      return null;
    }
  }, [parsed, tolerance]);

  const downloadUrl = useMemo(() => {
    if (!result) return null;
    return URL.createObjectURL(new Blob([result.gpxXml], { type: "application/gpx+xml" }));
  }, [result]);

  const reduction = result
    ? Math.round((1 - result.simplifiedPointCount / result.originalPointCount) * 100)
    : null;

  return (
    <div>
      <FileDropZone onFiles={handleFiles} />

      {error && (
        <p role="alert" style={{ color: "#e63946", marginTop: "1rem" }}>
          {error}
        </p>
      )}

      {parsed && (
        <div style={{ marginTop: "1.5rem" }}>
          <p style={{ color: "#666", fontSize: "0.9rem" }}>{fileName}</p>

          <label style={{ display: "block", marginBottom: "1rem" }}>
            Tolerance: {tolerance} m
            <input
              type="range"
              min={0}
              max={50}
              step={1}
              value={tolerance}
              onChange={(e) => setTolerance(Number(e.target.value))}
              style={{ display: "block", width: "100%", maxWidth: 300 }}
            />
          </label>

          {result && (
            <>
              <p>
                {result.originalPointCount.toLocaleString()} → {result.simplifiedPointCount.toLocaleString()}{" "}
                points ({reduction}% reduction)
              </p>
              <TrackStats summary={result.summary} />
              {downloadUrl && (
                <a
                  href={downloadUrl}
                  download="simplified.gpx"
                  style={{ display: "inline-block", marginBottom: "1rem" }}
                >
                  Download simplified.gpx
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
