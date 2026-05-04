import {
  VA_ROUTES,
  type LogbookListParams,
  type LogbookStats,
  type PirepDetail,
  type PirepListResponse,
} from "@/shared/types";

export type AirlineBinding = {
  baseUrl: string;
  token: string | null;
};

function buildQuery(params: LogbookListParams): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    search.set(key, String(value));
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

// Callers gate on `airline.token` via the query's `enabled`, so this should
// never be called with a null binding — assert for the type narrowing.
async function call<T>(
  airline: AirlineBinding | null,
  path: string,
  signal?: AbortSignal,
): Promise<T> {
  if (!airline?.token) throw new Error("VA session is not active");
  const res = await fetch(`${airline.baseUrl}${path}`, {
    headers: {
      Authorization: `Bearer ${airline.token}`,
      Accept: "application/json",
    },
    signal,
  });
  if (!res.ok) {
    throw new Error(`${res.status} ${res.statusText}`);
  }
  return (await res.json()) as T;
}

export const logbookApi = {
  listPireps: (
    airline: AirlineBinding | null,
    params: LogbookListParams = {},
    signal?: AbortSignal,
  ): Promise<PirepListResponse> =>
    call<PirepListResponse>(
      airline,
      VA_ROUTES.pireps + buildQuery(params),
      signal,
    ),

  getPirep: (
    airline: AirlineBinding | null,
    id: string,
    signal?: AbortSignal,
  ): Promise<PirepDetail> =>
    call<PirepDetail>(airline, VA_ROUTES.pirep(id), signal),

  getStats: (
    airline: AirlineBinding | null,
    signal?: AbortSignal,
  ): Promise<LogbookStats> =>
    call<LogbookStats>(airline, VA_ROUTES.stats, signal),
};
