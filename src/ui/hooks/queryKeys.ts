import type { LogbookListParams } from "@/shared/types";

// Centralised query keys so we can invalidate consistently from any caller.
// Scoped by VA base URL so a session swap doesn't leak another VA's cache.
export const logbookKeys = {
  all: (baseUrl: string) => ["logbook", baseUrl] as const,
  pireps: (baseUrl: string) => [...logbookKeys.all(baseUrl), "pireps"] as const,
  pirepList: (baseUrl: string, params: LogbookListParams) =>
    [...logbookKeys.pireps(baseUrl), "list", params] as const,
  pirepDetail: (baseUrl: string, id: string) =>
    [...logbookKeys.pireps(baseUrl), "detail", id] as const,
  stats: (baseUrl: string) => [...logbookKeys.all(baseUrl), "stats"] as const,
};
