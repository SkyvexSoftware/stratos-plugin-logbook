import { ArrowLeft } from "lucide-react";
import type { LogbookPirepStatus, PirepDetail } from "@/shared/types";
import { usePirepDetail } from "@/ui/hooks/usePirepDetail";
import { formatDuration } from "@/ui/helpers/format";
import { FlightMap } from "./FlightMap";
import { Sidebar } from "./Sidebar";

type Props = {
  pirepId: string;
  onBack: () => void;
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

export function LogbookDetail({ pirepId, onBack }: Props) {
  const { data: pirep, loading, error } = usePirepDetail(pirepId);

  if (loading) {
    return (
      <DetailShell onBack={onBack}>
        <div className="flex flex-1 items-center justify-center bg-[--background]">
          <span className="text-text-ghost text-xs uppercase tracking-wider">
            Loading PIREP…
          </span>
        </div>
      </DetailShell>
    );
  }

  if (error || !pirep) {
    return (
      <DetailShell onBack={onBack}>
        <div className="flex flex-1 items-center justify-center bg-[--background]">
          <div className="text-center">
            <div className="text-red-500 text-xs uppercase tracking-wider">
              {error?.message ?? "PIREP not found"}
            </div>
            <button
              onClick={onBack}
              className="text-text-muted hover:text-primary mt-2 text-[11px] underline"
            >
              Back to logbook
            </button>
          </div>
        </div>
      </DetailShell>
    );
  }

  return <Detail pirep={pirep} onBack={onBack} />;
}

function Detail({ pirep, onBack }: { pirep: PirepDetail; onBack: () => void }) {
  const aircraft = [pirep.aircraft_icao, pirep.aircraft_reg]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-border flex h-11 flex-shrink-0 items-center gap-3 overflow-hidden bg-[--sidebar] px-4">
        <button
          onClick={onBack}
          className="text-text-muted hover:text-primary flex flex-shrink-0 items-center gap-1 text-[11px] tracking-[0.06em] transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Logbook
        </button>
        <div className="bg-border h-[18px] w-px flex-shrink-0" />
        <span className="text-text-dim flex-shrink-0 font-mono text-[11px]">
          {pirep.id}
        </span>
        <span className="flex-shrink-0 font-mono text-sm font-medium text-foreground">
          {pirep.dep_icao} ——▶ {pirep.arr_icao}
        </span>
        {aircraft && (
          <span className="text-text-dim flex-shrink-0 text-[11px]">
            {aircraft}
          </span>
        )}
        <span
          className={`flex-shrink-0 border px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wider ${statusClasses(pirep.status)}`}
        >
          {pirep.status}
        </span>
        <div className="ml-auto flex flex-shrink-0 gap-5">
          <HeaderMetric
            label="Duration"
            value={formatDuration(pirep.duration_min)}
          />
          <HeaderMetric
            label="Distance"
            value={`${pirep.distance_nm.toLocaleString()} nm`}
          />
          <HeaderMetric
            label="Landing"
            value={`${pirep.landing_rate_fpm} fpm`}
          />
        </div>
      </div>

      {/* Body: Map + Sidebar */}
      <div className="flex flex-1 overflow-hidden">
        <FlightMap
          route={pirep.route}
          depIcao={pirep.dep_icao}
          arrIcao={pirep.arr_icao}
          distance={pirep.distance_nm}
        />
        <Sidebar pirep={pirep} />
      </div>
    </div>
  );
}

function DetailShell({
  onBack,
  children,
}: {
  onBack: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="border-border flex h-11 flex-shrink-0 items-center bg-[--sidebar] px-4">
        <button
          onClick={onBack}
          className="text-text-muted hover:text-primary flex items-center gap-1 text-[11px] tracking-[0.06em] transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Logbook
        </button>
      </div>
      <div className="flex flex-1 overflow-hidden">{children}</div>
    </div>
  );
}

function HeaderMetric({
  label,
  value,
  className = "text-text-muted",
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className="text-right">
      <div className="text-text-ghost text-[9px] uppercase tracking-[0.1em]">
        {label}
      </div>
      <div className={`font-mono text-xs ${className}`}>{value}</div>
    </div>
  );
}
