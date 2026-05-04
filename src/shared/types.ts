// `airline.base_url` already ends with `/api/stratos` — these are the leaf
// routes, joined onto that base.
export const VA_ROUTES = {
  pireps: "/logbook/pireps",
  pirep: (id: string) => `/logbook/pireps/${encodeURIComponent(id)}`,
  stats: "/logbook/stats",
} as const;

export type LogbookPirepStatus =
  | "pending"
  | "accepted"
  | "rejected"
  | "processing";

export type LogbookSortField =
  | "date"
  | "route"
  | "aircraft"
  | "duration"
  | "distance"
  | "landing_rate"
  | "status";

export type LogbookSortOrder = "asc" | "desc";

export type LogbookListParams = {
  limit?: number;
  offset?: number;
  sort?: LogbookSortField;
  order?: LogbookSortOrder;
  q?: string;
  status?: LogbookPirepStatus;
};

export type PirepListItem = {
  id: string;
  date: string;
  dep_icao: string;
  arr_icao: string;
  callsign: string;
  aircraft_icao: string | null;
  aircraft_reg: string | null;
  duration_min: number;
  distance_nm: number;
  landing_rate_fpm: number;
  status: LogbookPirepStatus;
};

export type PirepListResponse = {
  items: PirepListItem[];
  total: number;
  limit: number;
  offset: number;
};

export type RoutePoint = {
  t: number;
  lat: number;
  lon: number;
  alt_ft: number;
  spd_kt: number;
  hdg_deg: number;
};

export type LogEntry = {
  t: number;
  level: "info" | "warning" | "error";
  message: string;
};

export type PirepDetail = {
  id: string;
  date: string;
  dep_icao: string;
  arr_icao: string;
  callsign: string;
  aircraft_icao: string | null;
  aircraft_reg: string | null;
  status: LogbookPirepStatus;

  duration_min: number;
  block_time_min: number;
  air_time_min: number;
  distance_nm: number;
  fuel_used_kg: number;
  cruise_alt_ft: number;
  max_speed_kt: number;
  landing_rate_fpm: number;
  violations: number;
  simulator: string;
  network: string;

  route: RoutePoint[];
  log: LogEntry[];
};

export type LogbookStats = {
  total_flights: number;
  flights_this_month: number;
  hours_flown: number;
  hours_this_year: number;
  distance_nm: number;
  avg_landing_fpm: number;
  rank: string;
  rank_image: string;
};
