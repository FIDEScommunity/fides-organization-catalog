# Performance & Scaling Test Protocol (Organization Catalog)

This protocol defines when the current client-side loading model remains acceptable and when we should move to server-side paging/filtering.

## Scope

- Catalog: Organization Catalog
- Data source used by plugin UI: `data/aggregated.json`
- Current UI behavior: full payload is fetched client-side; filters/search/sort run in-browser.

## Why this protocol exists

Client-side "load more" improves DOM/render performance, but **does not reduce payload download and JSON parse cost** because the full JSON is still loaded first.

This protocol prevents "gut-feel" decisions by using repeatable metrics + explicit gates.

## Metrics to record

Measure on each release candidate:

1. **Payload size**
   - Raw bytes of `data/aggregated.json`
   - Gzip bytes of the same file
2. **Runtime metrics (mid-tier mobile profile)**
   - JSON fetch + parse + first full catalog render (ms)
   - Filter response time (search keystroke and checkbox filter, ms)
   - Interaction responsiveness (INP/jank signs)
3. **DOM impact**
   - Approximate DOM node count when listing is rendered

## Gating thresholds

### Green

- Gzip payload < **300 KB**
- First render (mobile profile) < **500 ms**
- Filter interactions < **100 ms**

Action:
- Keep current architecture.
- Optional: keep incremental UX optimizations (load-more/windowing).

### Orange

- Gzip payload **300-700 KB** OR
- First render **500-1200 ms** OR
- Filter interactions **100-250 ms**

Action:
- Keep/introduce client-side load-more and render-window optimizations.
- Monitor two consecutive releases before architecture switch.

### Red

- Gzip payload > **700 KB** OR
- First render > **1200-1500 ms** on mobile profile OR
- Filter interactions > **250 ms** consistently

Action:
- Prioritize server-side paging/filtering API.
- Stop adding major catalog growth without API rollout plan.

## Release decision rule

Use this simple rule:

- If **2 of 3** gate dimensions (payload, render, filter latency) are in orange/red for **2 consecutive releases**, create and prioritize a task for server-side paging/filtering migration.

## Fast automated payload check

Use the repository script:

```bash
node scripts/check-scaling-gates.mjs
```

Optional projection target:

```bash
node scripts/check-scaling-gates.mjs --target-count=400
```

This script reports:

- Current raw + gzip size
- Projected size at target count (linear estimate)
- Green/orange/red status
- Recommended next step

## Manual runtime check (browser)

Run on a representative catalog page using Chrome DevTools:

1. Enable mobile throttling profile (CPU + network).
2. Hard reload page.
3. Record:
   - Time until catalog list is visible/interactive.
   - Typing in search field latency.
   - Filter toggle latency.
4. Repeat 3 times and keep median.

Store results in PR notes or release notes.

## Migration trigger (what to build when red)

When red gate is reached, target:

- `GET /organization?page=&size=&search=&country=&sector=&certification=&role=&sort=&direction=`
- List endpoint returns only needed listing fields.
- Detail endpoint by id for modal/deeplink detail data.
- Keep deep links stable (`?org=org:...`).

## Suggested PR checklist snippet

- [ ] Ran `node scripts/check-scaling-gates.mjs`
- [ ] Captured mobile-profile render + filter timings
- [ ] Compared against green/orange/red gates
- [ ] Documented result + decision (stay client-side vs plan API paging)

