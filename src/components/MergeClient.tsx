import { useCallback, useMemo, useState } from "react";
import type { ParsedGPX } from "@we-gold/gpxjs";
import { parseGpxFile, summarizeTracks, mergeTracks } from "@/lib/engine/gpx";
import FileDropZone from "./FileDropZone";
import MapView from "./MapView";
import TrackStats from "./TrackStats";

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
        <p role="alert" style={{ color: "#e63946", marginTop: "1rem" }}>
          {error}
        </p>
      )}

      {files.length > 0 && (
        <ul style={{ marginTop: "1rem", paddingLeft: "1.25rem" }}>
          {files.map((f, i) => (
            <li key={`${f.name}-${i}`}>
              {f.name}{" "}
              <button
                type="button"
                onClick={() => removeFile(i)}
                style={{ marginLeft: "0.5rem", fontSize: "0.8rem" }}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}

      {files.length === 1 && (
        <p style={{ color: "#666", fontSize: "0.9rem", marginTop: "0.5rem" }}>
          Add at least one more GPX file to merge.
        </p>
      )}

      {result && downloadUrl && (
        <div style={{ marginTop: "1.5rem" }}>
          <TrackStats summary={result.summary} />
          <a
            href={downloadUrl}
            download="merged.gpx"
            style={{ display: "inline-block", marginBottom: "1rem" }}
          >
            Download merged.gpx
          </a>
          <MapView geoJson={result.geoJson} />
        </div>
      )}
    </div>
  );
}
