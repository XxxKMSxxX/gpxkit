import { useCallback, useMemo, useState } from "react";
import type { ParsedGPX } from "@we-gold/gpxjs";
import { parseGpxFile, summarizeTracks, simplifyTrack } from "@/lib/engine/gpx";
import FileDropZone from "./FileDropZone";
import MapView from "./MapView";
import TrackStats from "./TrackStats";
import DownloadButton from "./DownloadButton";

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
        <p role="alert" className="mt-4 font-mono text-sm text-trace">
          {error}
        </p>
      )}

      {parsed && (
        <div className="mt-8">
          <p className="mb-4 font-mono text-xs tracking-[0.05em] text-faint">{fileName}</p>

          <label className="mb-6 block max-w-xs">
            <span className="font-mono text-xs tracking-[0.05em] text-muted uppercase">
              Tolerance: <span className="text-paper">{tolerance} m</span>
            </span>
            <input
              type="range"
              min={0}
              max={50}
              step={1}
              value={tolerance}
              onChange={(e) => setTolerance(Number(e.target.value))}
              className="mt-2 block w-full accent-trace"
            />
          </label>

          {result && (
            <>
              <p className="mb-4 font-mono text-sm text-muted">
                {result.originalPointCount.toLocaleString()} → {result.simplifiedPointCount.toLocaleString()}{" "}
                points <span className="text-trace">({reduction}% reduction)</span>
              </p>
              <TrackStats summary={result.summary} />
              {downloadUrl && (
                <DownloadButton href={downloadUrl} fileName="simplified.gpx">
                  Download simplified.gpx
                </DownloadButton>
              )}
              <MapView geoJson={result.geoJson} />
            </>
          )}
        </div>
      )}
    </div>
  );
}
