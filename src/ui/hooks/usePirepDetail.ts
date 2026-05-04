import { useQuery } from "@tanstack/react-query";
import { logbookApi } from "@/ui/api";
import { useAirline } from "@/ui/hooks/useAirline";
import { logbookKeys } from "@/ui/hooks/queryKeys";
import type { PirepDetail } from "@/shared/types";

type Result = {
  data: PirepDetail | null;
  loading: boolean;
  error: Error | null;
};

export function usePirepDetail(id: string | null): Result {
  const airline = useAirline();
  const enabled = !!airline?.token && id !== null;

  const query = useQuery({
    queryKey: logbookKeys.pirepDetail(airline?.baseUrl ?? "", id ?? ""),
    queryFn: ({ signal }) => logbookApi.getPirep(airline, id as string, signal),
    enabled,
    staleTime: 5 * 60_000,
  });

  return {
    data: query.data ?? null,
    loading: query.isPending && enabled,
    error: query.error,
  };
}
