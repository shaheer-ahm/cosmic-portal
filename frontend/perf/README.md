# Frontend performance tests

Measures how long each page takes to load on a first visit, using the
production build with a fake (mocked) backend, so results don't depend on
Render cold starts, internet connection or the live database.

| File | What it does |
|---|---|
| `perf.mjs` | Loads every page 5 times under a **mobile** and a **desktop** profile and saves the median times to a JSON file |
| `nav.mjs` | Times moving between pages inside the app (Dashboard → Orders → New order) |
| `compare.mjs` | Turns one or two result files into Markdown tables for documentation |
| `mocks.mjs` | The fake login session and API responses the scripts share |
| `check_fixes.mjs` | Browser checks for the October bug fixes (only added with those fixes) |

**Profiles:** mobile = Lighthouse's default mobile settings (slow 4G: 1.6 Mbps,
150 ms latency; CPU slowed 4×). Desktop = 10 Mbps, 40 ms latency, normal CPU.
Every API call is delayed 200 ms to mimic the real backend.

**Measurements per page:**

- **Ready**: when the page's main content is visible (e.g. the order list on
  Orders). This is what a user actually waits for.
- **First paint**: when anything first appears on screen.
- **JS downloaded**: compressed JavaScript the page downloaded.
- **API calls**: requests made to the backend while loading.

## Running

All commands from the `frontend/` folder. Needs Node and `npm ci` already done.

```bash
# 1. Build against the fake backend, into its own folder (your real .env and
#    dist/ are left alone; these values are only for the test build)
VITE_SUPABASE_URL=https://example.supabase.co \
VITE_SUPABASE_PUBLISHABLE_KEY=test \
VITE_API_BASE_URL=http://localhost:9/api/v1 \
npx vite build --outDir perf-dist

# 2. Serve that build (leave this running; use a second terminal for the rest)
npx vite preview --outDir perf-dist --port 4173

# 3. Install the test browser once (not added to package.json on purpose)
npm i --no-save playwright
npx playwright install chromium

# 4. Measure (about 5 minutes) and save the results
node perf/perf.mjs "before" perf-before.json 5
node perf/nav.mjs

# 5. Make tables for your documentation
node perf/compare.mjs perf-before.json
```

The `VITE_SUPABASE_URL` above must be exactly `https://example.supabase.co`:
the fake login in `mocks.mjs` depends on it.

## Comparing before and after

1. Run the steps above on the current code and keep `perf-before.json`.
2. Apply the changes, repeat steps 1–2, then
   `node perf/perf.mjs "after" perf-after.json 5`.
3. `node perf/compare.mjs perf-before.json perf-after.json` prints both side by
   side with the % change.

## Notes

- Expect a few % difference between runs; that's why each page is loaded 5
  times and the median is used. Close other heavy apps while it runs.
- The absolute numbers depend on your computer. Compare runs made on the same
  machine, not against someone else's numbers.

