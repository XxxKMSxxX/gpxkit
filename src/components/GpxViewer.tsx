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
        <p role="alert" className="mt-4 font-mono text-sm text-trace">
          {state.message}
        </p>
      )}

      {state.status === "loaded" && (
        <div className="mt-8">
          <p className="mb-3 font-mono text-xs tracking-[0.05em] text-faint">{state.fileName}</p>
          <TrackStats summary={state.summary} />
          <MapView geoJson={state.geoJson} />
        </div>
      )}
    </div>
  );
}
