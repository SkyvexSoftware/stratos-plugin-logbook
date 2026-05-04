import type { LogEntry, PirepDetail } from "@/shared/types";
import { formatTime } from "@/ui/helpers/format";
import { VerticalProfile } from "./VerticalProfile";

type Props = {
  pirep: PirepDetail;
};

function dotColor(level: LogEntry["level"]): string {
  switch (level) {
    case "error":
      return "bg-red-500";
    case "warning":
      return "bg-amber-400";
    case "info":
      return "bg-green-500";
  }
}

export function Sidebar({ pirep }: Props) {
  return (
    <div className="border-border-subtle flex w-[265px] flex-shrink-0 flex-col overflow-hidden border-l">
      {/* Activity Log Header */}
      <div className="border-border-subtle flex-shrink-0 border-b px-3.5 py-2.5">
        <div className="text-text-ghost text-[9px] font-medium uppercase tracking-[0.13em]">
          Activity Log
        </div>
      </div>

      {/* Activity Log Entries */}
      <div className="flex-1 overflow-y-auto px-3.5 py-2.5">
        {pirep.log.length === 0 && (
          <div className="text-text-ghost text-[10px]">No log entries.</div>
        )}
        {pirep.log.map((entry, i) => (
          <div key={i} className="mb-2.5 flex items-start gap-2">
            <div
              className={`mt-[5px] h-[5px] w-[5px] flex-shrink-0 rounded-full ${dotColor(entry.level)}`}
            />
            <div className="text-text-ghost min-w-[36px] flex-shrink-0 pt-px font-mono text-[10px]">
              {formatTime(entry.t)}
            </div>
            <div className="text-text-dim text-[11px] leading-[1.45]">
              {entry.message}
            </div>
          </div>
        ))}
      </div>

      {/* Vertical Profile */}
      <VerticalProfile route={pirep.route} />
    </div>
  );
}
