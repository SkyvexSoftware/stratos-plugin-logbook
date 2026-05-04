import { useMemo } from "react";
import { usePluginContext } from "@skyvexsoftware/stratos-sdk";
import type { AirlineBinding } from "@/ui/api";

export function useAirline(): AirlineBinding | null {
  const { airline } = usePluginContext();

  return useMemo(() => {
    if (!airline) return null;
    return { baseUrl: airline.base_url, token: airline.token };
  }, [airline]);
}
