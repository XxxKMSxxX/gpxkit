import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { GeoJSON as GpxGeoJSON } from "@we-gold/gpxjs";

// OpenFreeMap's hosted public instance: no API key, no published request limit,
// commercial use allowed (donation-funded). Swap this one constant to move to a
// self-hosted Protomaps PMTiles style (e.g. served from Cloudflare R2) later if
// OpenFreeMap's free capacity ever becomes a concern.
const MAP_STYLE_URL = "https://tiles.openfreemap.org/styles/liberty";
const TRACK_SOURCE_ID = "gpx-track";
const LINE_LAYER_ID = "gpx-track-line";
const POINT_LAYER_ID = "gpx-track-point";

type MapViewProps = {
  geoJson: GpxGeoJSON | null;
};

export default function MapView({ geoJson }: MapViewProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);

  // Init/teardown the map once per mount. MapLibre needs a real DOM/WebGL
  // context, so this only ever runs client-side (the page renders this
  // component with client:only, so there's no SSR pass to guard against).
  useEffect(() => {
    if (containerRef.current === null) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: MAP_STYLE_URL,
      center: [0, 0],
      zoom: 1,
    });
    map.addControl(new maplibregl.NavigationControl(), "top-right");
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Push new track data in whenever it changes, once the style has loaded.
  useEffect(() => {
    const map = mapRef.current;
    if (map === null || geoJson === null) return;

    const applyTrack = () => {
      const data = withEndpointMarkers(geoJson) as unknown as GeoJSON.FeatureCollection;
      const existingSource = map.getSource(TRACK_SOURCE_ID) as maplibregl.GeoJSONSource | undefined;

      if (existingSource) {
        existingSource.setData(data);
      } else {
        map.addSource(TRACK_SOURCE_ID, { type: "geojson", data });
        map.addLayer({
          id: LINE_LAYER_ID,
          type: "line",
          source: TRACK_SOURCE_ID,
          filter: ["==", ["geometry-type"], "LineString"],
          paint: { "line-color": "#e63946", "line-width": 3 },
        });
        map.addLayer({
          id: POINT_LAYER_ID,
          type: "circle",
          source: TRACK_SOURCE_ID,
          filter: ["==", ["geometry-type"], "Point"],
          paint: {
            "circle-color": "#f1f1f1",
            "circle-radius": 5,
            "circle-stroke-color": "#e63946",
            "circle-stroke-width": 1.5,
          },
        });
      }

      const bounds = computeBounds(geoJson);
      if (bounds) map.fitBounds(bounds, { padding: 40, duration: 0 });
    };

    if (map.isStyleLoaded()) applyTrack();
    else map.once("load", applyTrack);
  }, [geoJson]);

  return (
    <div className="overflow-hidden rounded-lg border border-line">
      <div ref={containerRef} className="h-[480px] w-full" />
    </div>
  );
}

/**
 * Marks the track's start and end coordinates as Point features so they render
 * on the map — the two points that matter most for privacy, since a track's
 * start/end usually is home or work.
 */
function withEndpointMarkers(geoJson: GpxGeoJSON): object {
  const lineCoords = geoJson.features
    .filter((feature) => feature.geometry.type === "LineString")
    .flatMap((feature) => feature.geometry.coordinates as (number | null)[][])
    .filter((coord): coord is number[] => coord[0] != null && coord[1] != null);

  const endpoints =
    lineCoords.length > 0
      ? [lineCoords[0], lineCoords[lineCoords.length - 1]].map((coord) => ({
          type: "Feature" as const,
          geometry: { type: "Point" as const, coordinates: coord },
          properties: {},
        }))
      : [];

  return { ...geoJson, features: [...geoJson.features, ...endpoints] };
}

/** Bounding box across every feature's coordinates, ignoring any null lng/lat. */
function computeBounds(geoJson: GpxGeoJSON): [[number, number], [number, number]] | null {
  let minLng = Infinity;
  let minLat = Infinity;
  let maxLng = -Infinity;
  let maxLat = -Infinity;
  let found = false;

  for (const feature of geoJson.features) {
    const coords = feature.geometry.coordinates;
    const points: (number | null)[][] = Array.isArray(coords[0])
      ? (coords as (number | null)[][])
      : [coords as (number | null)[]];

    for (const point of points) {
      const [lng, lat] = point;
      if (lng == null || lat == null) continue;
      found = true;
      minLng = Math.min(minLng, lng);
      minLat = Math.min(minLat, lat);
      maxLng = Math.max(maxLng, lng);
      maxLat = Math.max(maxLat, lat);
    }
  }

  return found
    ? [
        [minLng, minLat],
        [maxLng, maxLat],
      ]
    : null;
}
