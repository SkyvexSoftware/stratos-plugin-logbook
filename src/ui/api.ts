import {
  VA_ROUTES,
  type LogbookListParams,
  type LogbookStats,
  type PirepDetail,
  type PirepListResponse,
} from "@/shared/types";

/** Snapshot of the bound airline — used by hooks to gate queries / key caches. */
export type AirlineBinding = {
  baseUrl: string;
  token: string | null;
};

/**
 * Minimal shape of the shell's VA API client (the axios instance returned by
 * `useVaApi()`). It already carries the airline base URL + bearer and refreshes
 * the token on a 401, so callers just hand it a relative path. Typed
 * structurally so this module needs no axios dependency.
 */
export type VaClient = {
  get<T>(
    url: string,
    config?: { signal?: AbortSignal },
  ): Promise<{ data: T }>;
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

async function call<T>(
  va: VaClient,
  path: string,
  signal?: AbortSignal,
): Promise<T> {
  const res = await va.get<T>(path, { signal });
  return res.data;
}

export const logbookApi = {
  listPireps: (
    va: VaClient,
    params: LogbookListParams = {},
    signal?: AbortSignal,
  ): Promise<PirepListResponse> =>
    call<PirepListResponse>(va, VA_ROUTES.pireps + buildQuery(params), signal),

  getPirep: (
    va: VaClient,
    id: string,
    signal?: AbortSignal,
  ): Promise<PirepDetail> => call<PirepDetail>(va, VA_ROUTES.pirep(id), signal),

  getStats: (va: VaClient, signal?: AbortSignal): Promise<LogbookStats> =>
    call<LogbookStats>(va, VA_ROUTES.stats, signal),
};
