import { useQuery } from "@tanstack/react-query";
import { useVaApi } from "@skyvexsoftware/stratos-sdk";
import { logbookApi } from "@/ui/api";
import { useAirline } from "@/ui/hooks/useAirline";
import { logbookKeys } from "@/ui/hooks/queryKeys";
import type { LogbookStats } from "@/shared/types";

type Result = {
  data: LogbookStats | null;
  loading: boolean;
  error: Error | null;
};

export function useLogbookStats(): Result {
  const airline = useAirline();
  const va = useVaApi();
  const enabled = !!airline?.token;

  const query = useQuery({
    queryKey: logbookKeys.stats(airline?.baseUrl ?? ""),
    queryFn: ({ signal }) => logbookApi.getStats(va, signal),
    enabled,
    staleTime: 60_000,
  });

  return {
    data: query.data ?? null,
    loading: query.isPending && enabled,
    error: query.error,
  };
}
