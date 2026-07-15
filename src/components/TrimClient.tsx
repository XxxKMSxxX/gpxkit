import { useCallback, useMemo, useState } from "react";
import type { ParsedGPX } from "@we-gold/gpxjs";
import { parseGpxFile, summarizeTracks, trimTrack } from "@/lib/engine/gpx";
import { DEMO_TRACK_URL, fetchAsFile } from "@/src/lib/demoFiles";
import FileDropZone from "./FileDropZone";
import MapView from "./MapView";
import TrackStats from "./TrackStats";
import DownloadButton from "./DownloadButton";
import SampleLink from "./SampleLink";

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

  const loadSample = useCallback(async () => {
    try {
      const file = await fetchAsFile(DEMO_TRACK_URL, "sample-hike.gpx");
      await handleFiles([file]);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, [handleFiles]);

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
      <SampleLink label="Try a sample track" onClick={loadSample} />

      {error && (
        <p role="alert" className="mt-4 font-mono text-sm text-trace">
          {error}
        </p>
      )}

      {parsed && range && (
        <div className="mt-8">
          <p className="mb-4 font-mono text-xs tracking-[0.05em] text-faint">{fileName}</p>

          <label className="mb-4 block max-w-xs">
            <span className="font-mono text-xs tracking-[0.05em] text-muted uppercase">
              Start point: <span className="text-paper">{range[0]}</span>
            </span>
            <input
              type="range"
              min={0}
              max={totalPoints - 1}
              value={range[0]}
              onChange={(e) => setRange([Math.min(Number(e.target.value), range[1]), range[1]])}
              className="mt-2 block w-full accent-trace"
            />
          </label>
          <label className="mb-6 block max-w-xs">
            <span className="font-mono text-xs tracking-[0.05em] text-muted uppercase">
              End point: <span className="text-paper">{range[1]}</span>
            </span>
            <input
              type="range"
              min={0}
              max={totalPoints - 1}
              value={range[1]}
              onChange={(e) => setRange([range[0], Math.max(Number(e.target.value), range[0])])}
              className="mt-2 block w-full accent-trace"
            />
          </label>

          {result && (
            <>
              <p className="mb-4 font-mono text-sm text-muted">
                Keeping <span className="text-paper">{result.trimmedPointCount.toLocaleString()}</span> of{" "}
                {result.originalPointCount.toLocaleString()} points
              </p>
              <TrackStats summary={result.summary} />
              {downloadUrl && (
                <DownloadButton href={downloadUrl} fileName="trimmed.gpx">
                  Download trimmed.gpx
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
