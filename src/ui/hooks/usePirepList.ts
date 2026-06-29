import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useVaApi } from "@skyvexsoftware/stratos-sdk";
import { logbookApi } from "@/ui/api";
import { useAirline } from "@/ui/hooks/useAirline";
import { logbookKeys } from "@/ui/hooks/queryKeys";
import type { LogbookListParams, PirepListResponse } from "@/shared/types";

const EMPTY: PirepListResponse = { items: [], total: 0, limit: 0, offset: 0 };

export function usePirepList(params: LogbookListParams) {
  const airline = useAirline();
  const va = useVaApi();
  const enabled = !!airline?.token;

  const query = useQuery({
    queryKey: logbookKeys.pirepList(airline?.baseUrl ?? "", params),
    queryFn: ({ signal }) => logbookApi.listPireps(va, params, signal),
    enabled,
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });

  return {
    data: query.data ?? EMPTY,
    loading: query.isPending && enabled,
    error: query.error,
  };
}
