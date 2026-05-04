export function formatDuration(minutes: number): string {
  if (!Number.isFinite(minutes) || minutes <= 0) return "0h 00m";
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes - h * 60);
  return `${h}h ${m.toString().padStart(2, "0")}m`;
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const day = d.getUTCDate().toString().padStart(2, "0");
  const month = d
    .toLocaleString("en-GB", { month: "short", timeZone: "UTC" })
    .toUpperCase();
  const year = d.getUTCFullYear();
  return `${day} ${month} ${year}`;
}

export function formatTime(ms: number): string {
  if (!Number.isFinite(ms)) return "00:00";
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}
