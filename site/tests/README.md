# Running the directory tests

Use Node 22.18 or newer. From `site/`, install with `npm ci --no-audit --no-fund`, then run `npm run content:check`, `npm run typecheck` and `npm test`. Build with `npm run build`, install the matching Playwright Chromium with `npx playwright install --with-deps chromium`, and run `CI=1 npm run test:e2e` against the production files. Run the package's root `npm test` separately to compile and check the canonical registry.

The edition timeline test checks every object at every retained review date. Date is the outer loop so the package's bounded, immutable date cache can serve all objects in that edition. Preserve the complete date/object cross product and all assessment and timing assertions when changing traversal.

Browser waits observe rendered results and the search address. Performance measurements and negative observation windows retain their real clock and thresholds. Do not replace them with fake timers or reduced motion.

The Site workflow caches only npm's download store under `site/package-lock.json` and still installs from that lockfile. Its paths include the root `styles.css`, which the guide imports directly, as well as the directory, registry data, compiled package and package manifest. Publishing and preview workflows have independent setup and are not changed by this cache.
