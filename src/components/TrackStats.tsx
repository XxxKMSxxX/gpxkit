import type { TrackSummary } from "@/lib/engine/gpx";

type TrackStatsProps = {
  summary: TrackSummary;
};

export default function TrackStats({ summary }: TrackStatsProps) {
  const stats: { label: string; value: string }[] = [
    { label: "Distance", value: `${(summary.totalDistanceMeters / 1000).toFixed(2)} km` },
    {
      label: "Elevation gain",
      value: summary.elevationGainMeters !== null ? `+${Math.round(summary.elevationGainMeters)} m` : "—",
    },
    {
      label: "Elevation loss",
      value: summary.elevationLossMeters !== null ? `-${Math.round(summary.elevationLossMeters)} m` : "—",
    },
    { label: "Points", value: summary.pointCount.toLocaleString() },
    { label: "Duration", value: formatDuration(summary.totalDurationSeconds) },
  ];

  return (
    <dl style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap", margin: "1rem 0" }}>
      {stats.map((s) => (
        <div key={s.label}>
          <dt style={{ fontSize: "0.8rem", color: "#666" }}>{s.label}</dt>
          <dd style={{ margin: 0, fontSize: "1.25rem", fontWeight: 600 }}>{s.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function formatDuration(totalSeconds: number): string {
  if (totalSeconds <= 0) return "—";
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
}
