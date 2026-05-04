import { ChevronRight } from "lucide-react";
import type { LogbookPirepStatus, PirepListItem } from "@/shared/types";
import { formatDate, formatDuration } from "@/ui/helpers/format";

type Props = {
  pirep: PirepListItem;
  onClick: () => void;
};

function statusClasses(status: LogbookPirepStatus): string {
  switch (status) {
    case "accepted":
      return "border-green-500/30 bg-green-500/[0.06] text-green-500";
    case "pending":
      return "border-amber-400/30 bg-amber-400/[0.06] text-amber-400";
    case "rejected":
      return "border-red-500/30 bg-red-500/[0.06] text-red-500";
    case "processing":
      return "border-blue-400/30 bg-blue-400/[0.06] text-blue-400";
  }
}

export function FlightRow({ pirep, onClick }: Props) {
  const aircraft = pirep.aircraft_icao ?? pirep.aircraft_reg ?? "—";

  return (
    <button
      onClick={onClick}
      aria-label={`Open ${pirep.callsign} ${pirep.dep_icao} to ${pirep.arr_icao}`}
      className="group border-border-subtle hover:bg-muted/40 grid w-full grid-cols-[86px_1fr_98px_76px_76px_84px_96px_24px] items-center gap-x-3 border-b px-4 py-2.5 text-left transition-colors"
    >
      <span className="font-mono text-[10px] text-text-dim">
        {formatDate(pirep.date)}
      </span>
      <span className="flex items-center">
        <span className="font-mono text-[13px] font-medium text-foreground">
          {pirep.dep_icao}
        </span>
        <span className="text-text-ghost px-1.5 text-[9px]">——▶</span>
        <span className="font-mono text-[13px] font-medium text-foreground">
          {pirep.arr_icao}
        </span>
      </span>
      <span className="font-mono text-[10px] text-text-dim">{aircraft}</span>
      <span className="font-mono text-xs text-text-muted">
        {formatDuration(pirep.duration_min)}
      </span>
      <span className="font-mono text-xs text-text-muted">
        {pirep.distance_nm.toLocaleString()} nm
      </span>
      <span className="font-mono text-xs text-text-muted">
        {pirep.landing_rate_fpm} fpm
      </span>
      <span
        className={`justify-self-start border px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wider ${statusClasses(pirep.status)}`}
      >
        {pirep.status}
      </span>
      <ChevronRight
        aria-hidden="true"
        className="text-text-ghost group-hover:text-text-muted h-3.5 w-3.5 justify-self-end transition-colors"
      />
    </button>
  );
}
