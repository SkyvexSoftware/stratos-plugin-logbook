import { Badge, cn } from "@skyvexsoftware/stratos-sdk";
import type { LogbookPirepStatus } from "@/shared/types";

const STATUS_CLASSES: Record<LogbookPirepStatus, string> = {
  accepted: "border-green-500/30 bg-green-500/[0.06] text-green-500",
  pending: "border-amber-400/30 bg-amber-400/[0.06] text-amber-400",
  rejected: "border-red-500/30 bg-red-500/[0.06] text-red-500",
  processing: "border-blue-400/30 bg-blue-400/[0.06] text-blue-400",
};

type Props = {
  status: LogbookPirepStatus;
  className?: string;
};

export function StatusBadge({ status, className }: Props) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "rounded-none px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wider",
        STATUS_CLASSES[status],
        className,
      )}
    >
      {status}
    </Badge>
  );
}
