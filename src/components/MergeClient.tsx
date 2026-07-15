import { useCallback, useMemo, useState } from "react";
import type { ParsedGPX } from "@we-gold/gpxjs";
import { parseGpxFile, summarizeTracks, mergeTracks } from "@/lib/engine/gpx";
import FileDropZone from "./FileDropZone";
import MapView from "./MapView";
import TrackStats from "./TrackStats";
import DownloadButton from "./DownloadButton";

type LoadedFile = { name: string; parsed: ParsedGPX };

export default function MergeClient() {
  const [files, setFiles] = useState<LoadedFile[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleFiles = useCallback(async (incoming: File[]) => {
    const next: LoadedFile[] = [];
    for (const file of incoming) {
      try {
        const text = await file.text();
        next.push({ name: file.name, parsed: parseGpxFile(text) });
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
        return;
      }
    }
    setError(null);
    setFiles((prev) => [...prev, ...next]);
  }, []);

  const removeFile = useCallback((index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const result = useMemo(() => {
    if (files.length < 2) return null;
    try {
      const merged = mergeTracks({ files: files.map((f) => f.parsed) });
      return {
        geoJson: merged.merged.toGeoJSON(),
        summary: summarizeTracks(merged.merged),
        gpxXml: merged.gpxXml,
      };
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      return null;
    }
  }, [files]);

  const downloadUrl = useMemo(() => {
    if (!result) return null;
    return URL.createObjectURL(new Blob([result.gpxXml], { type: "application/gpx+xml" }));
  }, [result]);

  return (
    <div>
      <FileDropZone onFiles={handleFiles} multiple />

      {error && (
        <p role="alert" className="mt-4 font-mono text-sm text-trace">
          {error}
        </p>
      )}

      {files.length > 0 && (
        <ul className="mt-4 divide-y divide-line overflow-hidden rounded-lg border border-line bg-panel">
          {files.map((f, i) => (
            <li key={`${f.name}-${i}`} className="flex items-center justify-between px-4 py-2">
              <span className="font-mono text-xs text-muted">{f.name}</span>
              <button
                type="button"
                onClick={() => removeFile(i)}
                className="font-mono text-[0.65rem] tracking-[0.05em] text-faint uppercase transition-colors hover:text-trace"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}

      {files.length === 1 && (
        <p className="mt-3 font-mono text-xs text-faint">Add at least one more GPX file to merge.</p>
      )}

      {result && downloadUrl && (
        <div className="mt-8">
          <TrackStats summary={result.summary} />
          <DownloadButton href={downloadUrl} fileName="merged.gpx">
            Download merged.gpx
          </DownloadButton>
          <MapView geoJson={result.geoJson} />
        </div>
      )}
    </div>
  );
}
