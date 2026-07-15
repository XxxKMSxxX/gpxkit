import { useCallback, useState } from "react";
import type { GeoJSON as GpxGeoJSON } from "@we-gold/gpxjs";
import { parseGpxFile, summarizeTracks, type TrackSummary } from "@/lib/engine/gpx";
import FileDropZone from "./FileDropZone";
import MapView from "./MapView";
import TrackStats from "./TrackStats";

type ViewerState =
  | { status: "empty" }
  | { status: "error"; message: string }
  | { status: "loaded"; geoJson: GpxGeoJSON; summary: TrackSummary; fileName: string };

export default function GpxViewer() {
  const [state, setState] = useState<ViewerState>({ status: "empty" });

  const handleFiles = useCallback(async ([file]: File[]) => {
    try {
      const text = await file.text();
      const parsed = parseGpxFile(text);
      setState({
        status: "loaded",
        geoJson: parsed.toGeoJSON(),
        summary: summarizeTracks(parsed),
        fileName: file.name,
      });
    } catch (error) {
      setState({ status: "error", message: error instanceof Error ? error.message : String(error) });
    }
  }, []);

  return (
    <div>
      <FileDropZone onFiles={handleFiles} />

      {state.status === "error" && (
        <p role="alert" style={{ color: "#e63946", marginTop: "1rem" }}>
          {state.message}
        </p>
      )}

      {state.status === "loaded" && (
        <div style={{ marginTop: "1.5rem" }}>
          <p style={{ color: "#666", fontSize: "0.9rem" }}>{state.fileName}</p>
          <TrackStats summary={state.summary} />
          <MapView geoJson={state.geoJson} />
        </div>
      )}
    </div>
  );
}
