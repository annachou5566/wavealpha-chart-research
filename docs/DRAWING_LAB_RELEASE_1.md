# WaveAlpha Drawing Lab — Release 1 research slice

**Scope:** Independent implementation of 19 chart drawing geometries. This is NOT the full TradingView catalogue, renderer, algorithm implementation, or an exact visual clone. None of the TradingView installers, ASAR contents, source maps, binary assets or proprietary imagery is committed.

## What has been implemented

The new `demo/` local-only application draws **synthetic** OHLC candles in an HTML Canvas with crosshair, zoom, pan and pixel-space OHLC snapping.

The 19 implemented tools are: Trend Line, Ray, Extended Line, Horizontal Line, Vertical Line, Cross Line, Arrow, Parallel Channel, Pitchfork, Rectangle, Ellipse, Triangle, Text, Callout, Price/Time Measure, Fib Retracement, Fib Extension, Fib Time Zones and Fib Fan.

Document commands support undo/redo, single-object deletion, full drawing-list visibility transaction, drag/edit anchor handles, locking, annotations, local JSON import/export, owner/context validation, and IndexedDB local persistence. IndexedDB uses one in-flight transaction writer with coalescing, not a cloud/remote CAS implementation.

The geometry is independently authored. Fib configurations are explicit reference constants rather than claims about TradingView implementation.

## Running locally

Requirements: modern browser with Canvas, ES modules, IndexedDB, and Node 22+ for tests.

```sh
npm test
npm run check
python3 -m http.server 8000
```

Visit `http://localhost:8000/demo/`. Use one click for one-anchor objects, drag for two anchors, and three clicks for three-anchor objects. Double-click a selected Text or Callout to edit the label. Selected objects can be moved or reshaped by dragging handles; lock prevents edits. Reloading the same localhost origin should read the local IndexedDB document. This is an exploratory workflow, not verified browser behavior in the current delivery.

Do not use this application with real money, or assume any exchange data or authenticated cloud storage.

## Reproducible morluto/rea analysis

Source: https://github.com/morluto/rea

The repository's earlier TradingView desktop report states: REA CLI 6.7.0 metadata-only probes **PASS**, while the supervised JavaScript analysis was **BLOCKED** in that earlier environment by process ownership / `ps`. No claim of full chart code reconstruction was made, and source-map static parser fallback was not REA success.

This release adds `tools/rea-static-evidence.mjs` as a reproducible launcher. With authorized, already extracted `app.asar` bytes, a Node version satisfying `rea-agents@6.7.0`'s published engines, and the official CLI:

```sh
npm install --global rea-agents@6.7.0
node tools/rea-static-evidence.mjs /absolute/path/app.asar /tmp/rea-app-evidence.json
```

It runs static `rea analyze-javascript-application` with arguments (no shell), streams Evidence to a user-selected absolute path **outside the repository**, refuses overwrites, and never launches TradingView. The script has NOT been successfully run in this session: the current execution environment has Node 22.16.0, below REA 6.7.0 engine requirements. The installers' SHA-256 values are already in the public research report; these are input identities, not a finding of original drawing-engine behavior.

The user-provided TradingView installers and generated REA Evidence may contain proprietary code. Keep those off public GitHub and out of delivery assets.

## Qualification summary

- New seven unit tests: PASS **7/7 locally** against the source implementation, including 19 catalogue entries, geometry/hit tests, document validation, owner fence and history.
- Legacy repository test suite: not executed in this environment against exact GitHub branch checkout.
- HTML Canvas browser gesture, IndexedDB reload, mobile/touch, performance: NOT QUALIFIED (local browser navigation was blocked by environment policy).
- REA full supervised analysis: NOT RUN here; earlier work had a tool-environment blocker.
- Deployment, cloud identity/security and production data: NOT TOUCHED.

## Known gaps and next work

No exact TradingView tool inventory/behavior parity; no advanced Gann family, freehand brush, rotation, template presets, groups, multiple panes, per-tool style editors, cloud auth/CAS, realtime quotes, data subscriptions, Pine script, alerts, multiplayer, desktop shell, mobile QA or production migration.

Next: validate browser gestures, cancel/reload/IDB failure and touch behavior with a browser able to access localhost; run original and new tests on a full checkout; implement style editing, tool family parity matrix and recovery contracts; only then consider expansion. Do not merge on an unsupported claim of full feature parity.
