# Stratos Logbook Plugin

A pilot's flight history at a glance. Lists every PIREP filed against
the airline, paginated and sortable, with a per-PIREP detail view that
draws the recorded route on a map alongside performance stats and the
simulator activity log.

---

## Table of contents

- [Features](#features)
- [Architecture](#architecture)
- [VA backend contract](#va-backend-contract)
- [Development](#development)
- [About Skyvex Software](#about-skyvex-software)
- [License](#license)

---

## Features

- **Paginated PIREP list** — server-side pagination, sorting, and search.
- **Sortable columns** — date, route, aircraft, duration, distance,
  landing rate, status. Click a header to toggle direction.
- **Status filter** — All / Accepted / Pending / Rejected.
- **Search** — debounced across callsign, ICAOs, and registration.
- **Detail view** — recorded ACARS track on MapLibre + OpenFreeMap,
  performance breakdown, and a colour-coded activity log.
- **Vertical profile** — altitude over time derived from the route data.
- **Stats strip** — total flights, hours flown, distance, average
  landing rate, and current rank.

---

## Architecture

```
src/
├── shared/             # Types shared across the plugin
│   └── types.ts        # API contract types and route constants
└── ui/                 # Renderer (React 19 + Vite)
    ├── api.ts          # fetch wrappers around the three VA endpoints
    ├── hooks/          # TanStack Query hooks: list, detail, stats
    ├── helpers/        # formatters, geodesic math, MapLibre style
    └── components/     # LogbookList, LogbookDetail, FlightMap, Sidebar, …
```

UI-only — no background process. The renderer talks directly to the
VA's Stratos API using the bearer the SDK exposes via
`usePluginContext().airline`. Caching, request dedup, and abort-on-
unmount come from TanStack Query (sharing the QueryClient the Stratos
shell already provides).

---

## VA backend contract

The plugin calls the airline's API directly (no shell-side proxy). It
reads the VA base URL and bearer from the SDK's airline accessor.
`airline.base_url` is the airline's Stratos endpoint root (it already
includes the `/api/stratos` prefix), so the plugin appends only the
leaf route:

```ts
const { airline } = usePluginContext();
fetch(`${airline.base_url}/logbook/pireps`, {
  headers: { Authorization: `Bearer ${airline.token}` },
});
```

All three endpoints sit behind the airline's existing auth guard and
scope every query to the authenticated pilot. All field names are
`snake_case`.

### Routes

Mount under `api/stratos`, behind your auth guard:

| Method | Path                  | Purpose                                |
| ------ | --------------------- | -------------------------------------- |
| `GET`  | `/logbook/pireps`     | Paginated, sortable, searchable list   |
| `GET`  | `/logbook/pireps/:id` | Single PIREP with route + activity log |
| `GET`  | `/logbook/stats`      | All-time profile stats                 |

### `GET /logbook/pireps`

Query parameters:

| Param    | Type   | Default | Notes                                                                         |
| -------- | ------ | ------- | ----------------------------------------------------------------------------- |
| `limit`  | int    | 25      | 1–100                                                                         |
| `offset` | int    | 0       |                                                                               |
| `sort`   | enum   | `date`  | `date \| route \| aircraft \| duration \| distance \| landing_rate \| status` |
| `order`  | enum   | `desc`  | `asc \| desc`                                                                 |
| `q`      | string | —       | Matches `code`, `flightnum`, `dep_icao`, `arr_icao`, `aircraft_reg`           |
| `status` | enum   | —       | `pending \| accepted \| rejected \| processing`                               |

Response:

```json
{
  "items": [
    {
      "id": "QVA-29481",
      "date": "2026-04-07T00:00:00Z",
      "dep_icao": "KDFW",
      "arr_icao": "PHNL",
      "callsign": "QVA12",
      "aircraft_icao": "B77L",
      "aircraft_reg": "VH-QVZ",
      "duration_min": 737,
      "distance_nm": 6343,
      "landing_rate_fpm": -218,
      "status": "pending"
    }
  ],
  "total": 142,
  "limit": 25,
  "offset": 0
}
```

### `GET /logbook/pireps/:id`

Returns a single PIREP with its recorded route polyline and simulator
activity log. Returns `404` if the PIREP isn't owned by the
authenticated pilot — same response as a missing row, no
row-existence leak.

```json
{
  "id": "QVA-29481",
  "date": "2026-04-07T00:00:00Z",
  "dep_icao": "KDFW",
  "arr_icao": "PHNL",
  "callsign": "QVA12",
  "aircraft_icao": "B77L",
  "aircraft_reg": "VH-QVZ",
  "status": "pending",
  "duration_min": 737,
  "block_time_min": 765,
  "air_time_min": 737,
  "distance_nm": 6343,
  "fuel_used_kg": 64550,
  "cruise_alt_ft": 31000,
  "max_speed_kt": 495,
  "landing_rate_fpm": -218,
  "violations": 0,
  "simulator": "MSFS 2024",
  "network": "VATSIM",
  "route": [
    {
      "t": 0,
      "lat": 32.896,
      "lon": -97.038,
      "alt_ft": 0,
      "spd_kt": 0,
      "hdg_deg": 180
    }
  ],
  "log": [{ "t": 0, "level": "info", "message": "Connected — MSFS 2024" }]
}
```

`route[].t` is milliseconds since the first sample. `log[].level` is
one of `info | warning | error`.

### `GET /logbook/stats`

All-time profile stats for the authenticated pilot.

```json
{
  "total_flights": 142,
  "flights_this_month": 8,
  "hours_flown": 1247.4,
  "hours_this_year": 312.1,
  "distance_nm": 528340,
  "avg_landing_fpm": -185,
  "rank": "Senior First Officer",
  "rank_image": "https://cdn.example.com/ranks/sfo.png"
}
```

### Reference implementation (vanilla Laravel)

```php
Route::middleware('auth:api')->prefix('api/stratos/logbook')->group(function () {
    Route::get('pireps',       [LogbookController::class, 'pireps']);
    Route::get('pireps/{id}',  [LogbookController::class, 'pirep']);
    Route::get('stats',        [LogbookController::class, 'stats']);
});
```

```php
public function pireps(Request $request)
{
    $validated = $request->validate([
        'limit'  => ['sometimes', 'integer', 'min:1', 'max:100'],
        'offset' => ['sometimes', 'integer', 'min:0'],
        'sort'   => ['sometimes', 'in:date,route,aircraft,duration,distance,landing_rate,status'],
        'order'  => ['sometimes', 'in:asc,desc'],
        'q'      => ['sometimes', 'string', 'max:80'],
        'status' => ['sometimes', 'in:pending,accepted,rejected,processing'],
    ]);

    $query = Pirep::query()->where('pilot_id', Auth::id());

    if (! empty($validated['q'])) {
        $term = '%'.$validated['q'].'%';
        $query->where(function ($q) use ($term) {
            $q->where('flight_number', 'LIKE', $term)
                ->orWhere('dep_icao', 'LIKE', $term)
                ->orWhere('arr_icao', 'LIKE', $term);
        });
    }

    $total = (clone $query)->count();
    $items = $query
        ->orderBy($validated['sort'] ?? 'date', $validated['order'] ?? 'desc')
        ->offset($validated['offset'] ?? 0)
        ->limit($validated['limit'] ?? 25)
        ->get();

    return response()->json([
        'items'  => PirepListItem::collection($items),
        'total'  => $total,
        'limit'  => (int) ($validated['limit'] ?? 25),
        'offset' => (int) ($validated['offset'] ?? 0),
    ]);
}

public function pirep(string $id)
{
    $pirep = Pirep::query()
        ->where('id', $id)
        ->where('pilot_id', Auth::id())
        ->first();

    return $pirep
        ? response()->json(new PirepDetail($pirep))
        : response()->json(['message' => 'Not found'], 404);
}

public function stats()
{
    $user = Auth::user();
    return response()->json([
        'total_flights'  => $user->total_flights,
        'hours_flown'    => $user->total_hours,
        'distance_nm'    => Pirep::where('pilot_id', $user->id)->sum('distance'),
        'rank'           => $user->rank?->title,
        'rank_image'     => $user->rank?->image_url,
        // …other slices as needed
    ]);
}
```

---

## Development

```bash
pnpm install
pnpm dev          # Vite dev server for the UI
pnpm build        # Production bundle
pnpm bundle       # Build + run stratos-deploy to package the plugin
```

Just needs Stratos running locally with an authenticated VA session —
the plugin reads `airline.base_url` and `airline.token` from the SDK's
airline accessor.

---

## About Skyvex Software

[Skyvex Software](https://skyvexsoftware.com) builds Stratos — the
desktop companion app that bridges flight simulators with virtual
airline backends, hosting a plugin runtime so VAs and third parties can
ship pilot tools that share one app, one auth session, and one source
of flight truth.

- Website: <https://skyvexsoftware.com>
- Plugin SDK docs: <https://docs.skyvexsoftware.com/docs/plugins>

---

## License

[MIT](LICENSE) — see the LICENSE file for the full text.
