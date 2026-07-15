import type { TrackSummary } from "@/lib/engine/gpx";

type TrackStatsProps = {
  summary: TrackSummary;
};

export default function TrackStats({ summary }: TrackStatsProps) {
  const stats: { label: string; value: string }[] = [
    { label: "距離", value: `${(summary.totalDistanceMeters / 1000).toFixed(2)} km` },
    {
      label: "獲得標高",
      value: summary.elevationGainMeters !== null ? `+${Math.round(summary.elevationGainMeters)} m` : "—",
    },
    {
      label: "喪失標高",
      value: summary.elevationLossMeters !== null ? `-${Math.round(summary.elevationLossMeters)} m` : "—",
    },
    { label: "ポイント数", value: summary.pointCount.toLocaleString() },
    { label: "記録時間", value: formatDuration(summary.totalDurationSeconds) },
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
  return hours > 0 ? `${hours}時間${minutes}分` : `${minutes}分`;
}
