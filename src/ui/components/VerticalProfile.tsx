import { useMemo, useRef, useEffect } from "react";
import type { RoutePoint } from "@/shared/types";

type Props = {
  route?: RoutePoint[];
};

const HEIGHT = 140;

/**
 * SVG vertical profile of altitude over time. When real route data is
 * available, draw it; otherwise fall back to a generic climb-cruise-descent
 * curve so the panel stays composed instead of empty.
 */
export function VerticalProfile({ route = [] }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);

  const points = useMemo(() => {
    if (route.length < 2) return null;
    const maxAlt = Math.max(...route.map((r) => r.alt_ft), 1);
    const totalT = route[route.length - 1].t - route[0].t || 1;
    return route.map((r) => ({
      x: (r.t - route[0].t) / totalT,
      y: 1 - r.alt_ft / maxAlt,
    }));
  }, [route]);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    const W = svg.getBoundingClientRect().width || 200;
    const H = HEIGHT;

    let pts: [number, number][];
    if (points) {
      pts = points.map((p) => [p.x * W, 3 + p.y * (H - 3)]);
    } else {
      const n = 80;
      pts = Array.from({ length: n + 1 }, (_, i) => {
        const t = i / n;
        let a: number;
        if (t < 0.18) a = t / 0.18;
        else if (t < 0.78) a = 1 - 0.025 * Math.sin(t * 15 + 1);
        else a = Math.max(0, (1 - t) / 0.22);
        return [t * W, H - a * (H - 3)];
      });
    }

    const line = pts
      .map((p, i) =>
        i
          ? `L${p[0].toFixed(1)},${p[1].toFixed(1)}`
          : `M${p[0].toFixed(1)},${p[1].toFixed(1)}`,
      )
      .join("");
    const fill = `${line}L${W},${H}L0,${H}Z`;
    const mid = pts[Math.floor(pts.length / 2)];

    svg.innerHTML = `
      <path d="${fill}" fill="var(--primary, #e03030)" fill-opacity="0.12"/>
      <path d="${line}" fill="none" stroke="var(--primary, #e03030)" stroke-width="1.5"/>
      <circle cx="${mid[0].toFixed(1)}" cy="${mid[1].toFixed(1)}" r="2.5" fill="var(--primary, #e03030)"/>
    `;
  }, [points]);

  return (
    <div className="border-border-subtle flex-shrink-0 border-t bg-[--sidebar] px-3.5 py-3">
      <div className="text-text-ghost mb-2 text-[9px] font-medium uppercase tracking-[0.13em]">
        Vertical Profile
      </div>
      <svg
        ref={svgRef}
        width="100%"
        height={HEIGHT}
        preserveAspectRatio="none"
        className="block"
      />
    </div>
  );
}
