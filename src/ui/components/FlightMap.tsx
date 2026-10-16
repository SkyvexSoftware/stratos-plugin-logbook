import { useEffect, useMemo, useCallback, useRef, useState } from "react";
import { Source, Layer, Marker, type MapRef } from "react-map-gl/maplibre";
import { StratosMap } from "@skyvexsoftware/stratos-sdk";
import type { LngLatBoundsLike } from "maplibre-gl";
import { Maximize2 } from "lucide-react";
import type { RoutePoint } from "@/shared/types";
import { geodesicArc, unwrapLongitudes } from "@/ui/helpers/geodesic";

type Props = {
  route: RoutePoint[];
  depIcao: string;
  arrIcao: string;
  distance: number;
};

const PRIMARY_FALLBACK = "#e03030";

function readPrimaryColor(): string {
  if (typeof document === "undefined") return PRIMARY_FALLBACK;
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue("--primary")
    .trim();
  return raw || PRIMARY_FALLBACK;
}

export function FlightMap({ route, depIcao, arrIcao, distance }: Props) {
  // Read the VA's brand colour from CSS once on mount; maplibre paint
  // expressions don't resolve `var()` themselves, so we have to hand it
  // a literal colour string.
  const [primaryColor, setPrimaryColor] = useState<string>(PRIMARY_FALLBACK);
  useEffect(() => {
    setPrimaryColor(readPrimaryColor());
  }, []);

  // Use the recorded route when available; otherwise fall back to a geodesic
  // arc between first and last route point. With no points at all we render
  // an empty map (parent should typically guard).
  const hasRoute = route.length >= 2;
  const dep = hasRoute ? { lat: route[0].lat, lon: route[0].lon } : null;
  const arr = hasRoute
    ? { lat: route[route.length - 1].lat, lon: route[route.length - 1].lon }
    : null;

  const lineGeoJSON = useMemo(() => {
    if (!hasRoute) return null;
    const coords = unwrapLongitudes(route.map((p) => [p.lon, p.lat]));
    return {
      type: "Feature" as const,
      properties: {},
      geometry: { type: "LineString" as const, coordinates: coords },
    };
  }, [route, hasRoute]);

  const endpointGeoJSON = useMemo(() => {
    if (!dep || !arr) return null;
    return {
      type: "FeatureCollection" as const,
      features: [
        {
          type: "Feature" as const,
          properties: { type: "departure" },
          geometry: { type: "Point" as const, coordinates: [dep.lon, dep.lat] },
        },
        {
          type: "Feature" as const,
          properties: { type: "arrival" },
          geometry: { type: "Point" as const, coordinates: [arr.lon, arr.lat] },
        },
      ],
    };
  }, [dep, arr]);

  const bounds = useMemo((): LngLatBoundsLike | null => {
    if (!hasRoute) return null;
    const lons = route.map((p) => p.lon);
    const lats = route.map((p) => p.lat);
    return [
      [Math.min(...lons), Math.min(...lats)],
      [Math.max(...lons), Math.max(...lats)],
    ];
  }, [route, hasRoute]);

  // Aircraft icon at midpoint, oriented to local heading.
  const midpoint = useMemo(() => {
    if (!hasRoute) return null;
    const idx = Math.floor(route.length / 2);
    return route[idx];
  }, [route, hasRoute]);

  const heading = useMemo(() => {
    if (!hasRoute) return 0;
    const idx = Math.floor(route.length / 2);
    const a = route[Math.max(0, idx - 2)];
    const b = route[Math.min(route.length - 1, idx + 2)];
    // If recorded heading exists at midpoint, prefer it.
    if (Number.isFinite(midpoint?.hdg_deg) && (midpoint?.hdg_deg ?? 0) !== 0) {
      return midpoint!.hdg_deg;
    }
    // Use arc against the great-circle bridge for a smoother heading sample.
    const arc = geodesicArc(
      { lat: a.lat, lon: a.lon },
      { lat: b.lat, lon: b.lon },
    );
    if (arc.length < 2) return 0;
    const [ax, ay] = arc[0];
    const [bx, by] = arc[arc.length - 1];
    return (Math.atan2(bx - ax, by - ay) * 180) / Math.PI;
  }, [route, hasRoute, midpoint]);

  const mapRef = useRef<MapRef | null>(null);

  const resetView = useCallback(() => {
    const map = mapRef.current;
    if (!map || !bounds) return;
    map.fitBounds(bounds, {
      padding: 40,
      bearing: 0,
      pitch: 0,
      duration: 600,
    });
  }, [bounds]);

  if (!hasRoute || !bounds || !lineGeoJSON || !endpointGeoJSON || !midpoint) {
    return (
      <div className="flex min-w-0 flex-1 items-center justify-center bg-[--background]">
        <span className="text-text-ghost text-sm uppercase tracking-wider">
          No route data recorded
        </span>
      </div>
    );
  }

  return (
    <div className="relative min-w-0 flex-1 bg-[--background]">
      <StratosMap
        ref={mapRef}
        initialViewState={{
          bounds,
          fitBoundsOptions: { padding: 40 },
        }}
        style={{ width: "100%", height: "100%" }}
        scrollZoom={true}
      >
        {/* Recorded route line */}
        <Source id="route-line" type="geojson" data={lineGeoJSON}>
          <Layer
            id="route-line-layer"
            type="line"
            paint={{
              "line-color": primaryColor,
              "line-width": 1.8,
              "line-opacity": 0.85,
            }}
          />
        </Source>

        {/* Endpoint dots — both use the VA primary colour */}
        <Source id="endpoints" type="geojson" data={endpointGeoJSON}>
          <Layer
            id="endpoint-circles"
            type="circle"
            paint={{
              "circle-radius": 6,
              "circle-color": primaryColor,
              "circle-stroke-color": "#ffffff",
              "circle-stroke-width": 2,
            }}
          />
        </Source>

        {/* Aircraft marker at midpoint */}
        <Marker
          longitude={midpoint.lon}
          latitude={midpoint.lat}
          anchor="center"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            width="20"
            height="20"
            style={{
              fill: primaryColor,
              transform: `rotate(${Math.round(heading)}deg)`,
              opacity: 0.8,
            }}
          >
            <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
          </svg>
        </Marker>
      </StratosMap>

      {/* Map overlay */}
      <div
        className="border-border pointer-events-none absolute bottom-2.5 left-2.5 z-[1000] border px-2.5 py-1.5"
        style={{
          backgroundColor: "color-mix(in srgb, var(--card) 85%, transparent)",
        }}
      >
        <OverlayRow label="Dep" value={depIcao} />
        <OverlayRow label="Arr" value={arrIcao} />
        <OverlayRow label="GC Dist" value={`${distance.toLocaleString()} nm`} />
      </div>

      {/* Reset view button — refits to route bounds and zeroes bearing/pitch. */}
      <button
        type="button"
        onClick={resetView}
        title="Reset map view"
        aria-label="Reset map view"
        style={{
          backgroundColor: "color-mix(in srgb, var(--card) 92%, transparent)",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.25)",
        }}
        className="group text-foreground hover:!bg-[#e03030] hover:border-[#e03030] hover:text-white absolute right-2.5 top-2.5 z-[1000] flex h-9 items-center gap-2 border-2 border-[#e03030]/70 px-3 text-[11px] font-medium uppercase tracking-[0.14em] transition-colors"
      >
        <Maximize2 className="h-3.5 w-3.5 text-[#e03030] transition-colors group-hover:text-white" />
        Reset View
      </button>
    </div>
  );
}

function OverlayRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="mb-0.5 flex items-baseline gap-2 last:mb-0">
      <span className="text-text-dim min-w-[52px] text-[9px] uppercase tracking-[0.1em]">
        {label}
      </span>
      <span className="text-text-muted font-mono text-[11px]">{value}</span>
    </div>
  );
}
