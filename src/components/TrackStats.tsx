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
    <dl className="mb-6 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-5">
      {stats.map((s) => (
        <div key={s.label} className="bg-panel px-4 py-3">
          <dt className="font-mono text-[0.65rem] tracking-[0.1em] text-faint uppercase">{s.label}</dt>
          <dd className="mt-1 font-mono text-lg font-bold text-paper">{s.value}</dd>
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
