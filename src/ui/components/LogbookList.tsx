import { useEffect, useMemo, useState } from "react";
import { Button } from "@skyvexsoftware/stratos-sdk";
import type {
  LogbookListParams,
  LogbookPirepStatus,
  LogbookSortField,
  LogbookSortOrder,
} from "@/shared/types";
import { usePirepList } from "@/ui/hooks/usePirepList";
import { vaErrorMessage } from "@/ui/helpers/va-error";
import { useLogbookStats } from "@/ui/hooks/useLogbookStats";
import { StatsBar } from "./StatsBar";
import { FlightRow } from "./FlightRow";

type StatusFilter = "all" | LogbookPirepStatus;

type Props = {
  onSelect: (id: string) => void;
};

const FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "accepted", label: "Accepted" },
  { value: "pending", label: "Pending" },
  { value: "rejected", label: "Rejected" },
];

const COLUMNS: { label: string; sort?: LogbookSortField }[] = [
  { label: "Date", sort: "date" },
  { label: "Route", sort: "route" },
  { label: "Aircraft", sort: "aircraft" },
  { label: "Duration", sort: "duration" },
  { label: "Distance", sort: "distance" },
  { label: "Landing", sort: "landing_rate" },
  { label: "Status", sort: "status" },
];

const PAGE_SIZE = 25;

export function LogbookList({ onSelect }: Props) {
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sort, setSort] = useState<LogbookSortField>("date");
  const [order, setOrder] = useState<LogbookSortOrder>("desc");
  const [offset, setOffset] = useState(0);

  // Debounce search and reset paging when query/filter/sort changes.
  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedSearch(search.trim()), 250);
    return () => window.clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setOffset(0);
  }, [debouncedSearch, filter, sort, order]);

  const params = useMemo<LogbookListParams>(
    () => ({
      limit: PAGE_SIZE,
      offset,
      sort,
      order,
      ...(debouncedSearch ? { q: debouncedSearch } : {}),
      ...(filter !== "all" ? { status: filter } : {}),
    }),
    [debouncedSearch, filter, sort, order, offset],
  );

  const { data, loading, error } = usePirepList(params);
  const stats = useLogbookStats();

  const toggleSort = (field: LogbookSortField) => {
    if (sort === field) {
      setOrder(order === "asc" ? "desc" : "asc");
    } else {
      setSort(field);
      setOrder("desc");
    }
  };

  const totalPages = Math.max(1, Math.ceil(data.total / PAGE_SIZE));
  const currentPage = Math.floor(offset / PAGE_SIZE) + 1;

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-border flex h-11 items-center gap-2.5 border-b bg-[--sidebar] px-4">
        <span className="text-text-muted text-[11px] font-medium uppercase tracking-[0.12em]">
          Pilot Logbook
        </span>
        <div className="ml-auto flex items-center gap-2">
          <input
            type="text"
            placeholder="Search flights..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border-border bg-input font-sans text-text-muted placeholder:text-text-ghost w-36 border px-2.5 py-1 text-[11px] outline-none"
          />
          {FILTERS.map((f) => (
            <Button
              key={f.value}
              variant={filter === f.value ? "destructive" : "outline"}
              size="sm"
              onClick={() => setFilter(f.value)}
              className="h-6 px-2.5 text-[9px] uppercase tracking-wider"
            >
              {f.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <StatsBar stats={stats.data} loading={stats.loading} />

      {/* Column Headers */}
      <div className="border-border-subtle grid grid-cols-[86px_1fr_98px_76px_76px_84px_96px_24px] items-center gap-x-3 bg-[--sidebar] px-4 py-1.5">
        {COLUMNS.map((col) => {
          const active = col.sort === sort;
          const arrow = active ? (order === "asc" ? "▲" : "▼") : "";
          return (
            <button
              key={col.label}
              onClick={() => col.sort && toggleSort(col.sort)}
              disabled={!col.sort}
              className={`text-left text-[9px] uppercase tracking-[0.1em] ${
                active ? "text-text-muted" : "text-text-ghost"
              } ${col.sort ? "hover:text-text-muted cursor-pointer" : "cursor-default"}`}
            >
              {col.label}
              {arrow && <span className="ml-1 text-[8px]">{arrow}</span>}
            </button>
          );
        })}
      </div>

      {/* Rows */}
      <div className="flex-1 overflow-y-auto">
        {error && (
          <div className="px-4 py-8 text-center">
            <div className="text-red-500 text-xs">
              Failed to load PIREPs: {vaErrorMessage(error)}
            </div>
          </div>
        )}

        {!error && loading && data.items.length === 0 && (
          <div className="text-text-ghost px-4 py-8 text-center text-xs">
            Loading…
          </div>
        )}

        {!error && !loading && data.items.length === 0 && (
          <div className="text-text-ghost px-4 py-8 text-center text-xs uppercase tracking-wider">
            No flights logged
          </div>
        )}

        {data.items.map((p) => (
          <FlightRow key={p.id} pirep={p} onClick={() => onSelect(p.id)} />
        ))}
      </div>

      {/* Pagination */}
      {data.total > PAGE_SIZE && (
        <div className="border-border-subtle flex h-9 items-center justify-between border-t bg-[--sidebar] px-4">
          <span className="text-text-ghost text-[10px] uppercase tracking-wider">
            {offset + 1}–{Math.min(offset + PAGE_SIZE, data.total)} of{" "}
            {data.total}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={offset === 0}
              onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
              className="h-6 px-2 text-[9px] uppercase tracking-wider"
            >
              Prev
            </Button>
            <span className="text-text-muted font-mono text-[10px]">
              {currentPage} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={offset + PAGE_SIZE >= data.total}
              onClick={() => setOffset(offset + PAGE_SIZE)}
              className="h-6 px-2 text-[9px] uppercase tracking-wider"
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
