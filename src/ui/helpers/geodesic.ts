/**
 * Compute a geodesic arc (great circle) between two points.
 * Returns an array of [lon, lat] pairs (GeoJSON order).
 */
export function geodesicArc(
  start: { lat: number; lon: number },
  end: { lat: number; lon: number },
  segments = 64,
): [number, number][] {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const toDeg = (r: number) => (r * 180) / Math.PI;

  const lat1 = toRad(start.lat);
  const lon1 = toRad(start.lon);
  const lat2 = toRad(end.lat);
  const lon2 = toRad(end.lon);

  const d =
    2 *
    Math.asin(
      Math.sqrt(
        Math.sin((lat2 - lat1) / 2) ** 2 +
          Math.cos(lat1) * Math.cos(lat2) * Math.sin((lon2 - lon1) / 2) ** 2,
      ),
    );

  if (d < 1e-10)
    return [
      [start.lon, start.lat],
      [end.lon, end.lat],
    ];

  const points: [number, number][] = [];
  for (let i = 0; i <= segments; i++) {
    const f = i / segments;
    const A = Math.sin((1 - f) * d) / Math.sin(d);
    const B = Math.sin(f * d) / Math.sin(d);
    const x =
      A * Math.cos(lat1) * Math.cos(lon1) + B * Math.cos(lat2) * Math.cos(lon2);
    const y =
      A * Math.cos(lat1) * Math.sin(lon1) + B * Math.cos(lat2) * Math.sin(lon2);
    const z = A * Math.sin(lat1) + B * Math.sin(lat2);
    const lat = toDeg(Math.atan2(z, Math.sqrt(x * x + y * y)));
    const lon = toDeg(Math.atan2(y, x));
    points.push([lon, lat]);
  }
  return points;
}

/**
 * Unwrap longitudes so they stay continuous across the antimeridian (±180°).
 * Coords are [lon, lat] (GeoJSON order).
 */
export function unwrapLongitudes(
  coords: [number, number][],
): [number, number][] {
  if (coords.length < 2) return coords;
  const result: [number, number][] = [coords[0]];
  let offset = 0;
  for (let i = 1; i < coords.length; i++) {
    const diff = coords[i][0] - coords[i - 1][0];
    if (diff > 180) offset -= 360;
    else if (diff < -180) offset += 360;
    result.push([coords[i][0] + offset, coords[i][1]]);
  }
  return result;
}

/**
 * Post-load style tweaks: hide minor labels, force English, soften label styling.
 */
export function applyMapLabelOverrides(map: maplibregl.Map) {
  const style = map.getStyle();
  if (!style?.layers) return;

  for (const layer of style.layers) {
    if (layer.type === "symbol" && layer.layout?.["text-field"] !== undefined) {
      map.setLayoutProperty(layer.id, "text-field", [
        "coalesce",
        ["get", "name:en"],
        ["get", "name"],
      ]);
    }

    const id = layer.id.toLowerCase();
    if (
      id.includes("place-village") ||
      id.includes("place-hamlet") ||
      id.includes("highway-shield") ||
      id.includes("road_label_minor")
    ) {
      map.setLayoutProperty(layer.id, "visibility", "none");
    }

    if (layer.type === "symbol") {
      try {
        map.setPaintProperty(layer.id, "text-halo-width", 1.5);
        map.setPaintProperty(layer.id, "text-halo-blur", 1);
      } catch {
        // Some layers may not support these properties
      }
    }
  }
}
