import type { LogbookStats } from "@/shared/types";

type Props = {
  stats: LogbookStats | null;
  loading: boolean;
};

export function StatsBar({ stats, loading }: Props) {
  const placeholder = loading ? "…" : "0";
  const totalFlights = stats?.total_flights ?? 0;
  const hours = stats?.hours_flown ?? 0;
  const distance = stats?.distance_nm ?? 0;
  const avgLanding = stats?.avg_landing_fpm ?? 0;

  return (
    <div className="border-border-subtle grid grid-cols-5 border-b">
      <StatCell
        label="Total Flights"
        value={stats ? totalFlights.toLocaleString() : placeholder}
      />
      <StatCell
        label="Hours Flown"
        value={stats ? Math.round(hours).toLocaleString() : placeholder}
        unit="h"
      />
      <StatCell
        label="Distance"
        value={
          stats
            ? distance >= 1000
              ? `${Math.round(distance / 1000).toLocaleString()}k`
              : String(distance)
            : placeholder
        }
        unit="nm"
      />
      <StatCell
        label="Avg Landing"
        value={stats ? String(avgLanding) : placeholder}
        unit="fpm"
      />
      <RankCell stats={stats} loading={loading} />
    </div>
  );
}

function StatCell({
  label,
  value,
  unit,
  variant,
}: {
  label: string;
  value: string;
  unit?: string;
  variant?: "danger";
}) {
  return (
    <div className="border-border-subtle border-r px-4 py-3 last:border-r-0">
      <div className="text-text-ghost mb-1 text-[9px] font-medium uppercase tracking-widest">
        {label}
      </div>
      <div
        className={`font-mono text-base font-medium ${variant === "danger" ? "text-red-500" : "text-foreground"}`}
      >
        {value}
        {unit && (
          <span className="text-text-ghost ml-0.5 text-[11px]">{unit}</span>
        )}
      </div>
    </div>
  );
}

function RankCell({
  stats,
  loading,
}: {
  stats: LogbookStats | null;
  loading: boolean;
}) {
  const rank = stats?.rank?.trim();
  const rankImage = stats?.rank_image?.trim();

  return (
    <div className="border-border-subtle border-r px-4 py-3 last:border-r-0">
      <div className="text-text-ghost mb-1 text-[9px] font-medium uppercase tracking-widest">
        Rank
      </div>
      <div className="flex items-center gap-2">
        {rankImage && (
          <img
            src={rankImage}
            alt=""
            className="h-5 w-5 flex-shrink-0 object-contain"
          />
        )}
        <span
          className="text-foreground truncate text-[13px] font-medium"
          title={rank || ""}
        >
          {rank || (loading ? "…" : "—")}
        </span>
      </div>
    </div>
  );
}
