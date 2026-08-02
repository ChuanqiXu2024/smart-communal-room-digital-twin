# Performance Review

Review date: 2026-07-26. Measurements are Vite’s minified production output using Vite `8.1.5`.

## Bundle comparison

| Measurement | Reference build | Current build |
| --- | ---: | ---: |
| JavaScript chunks | 1 | 4 |
| Total JavaScript | 2,192.96 kB | 2,207.08 kB |
| Total JavaScript gzip | 574.36 kB | 579.59 kB |
| Application entry | Included in single 2,192.96 kB file | 228.73 kB / 72.03 kB gzip |
| PlayCanvas viewer | Included in single file | 1,971.89 kB / 505.31 kB gzip |
| Decision event log | Included in single file | 2.10 kB / 0.85 kB gzip |
| Development calibration panel | Included in single file | 4.36 kB / 1.40 kB gzip |
| Vite 500 kB warning | Present | Present for the PlayCanvas viewer chunk |

The current build is 14.12 kB larger (5.23 kB gzip) than the reference build and includes camera presets, presentation behaviour, loading/failure handling, responsive labels, and testable state. The useful improvement is separation: the application shell can parse independently, the event log is secondary, and development-only calibration is never requested by the production user flow. The viewer import starts immediately because the room is the primary experience; deliberately delaying it behind a click would harm the required opening experience.

## Dominant module

PlayCanvas Engine and its Gaussian Splat rendering, sorting, graphics-device, and asset-loader code dominate the 1.97 MB viewer chunk. Vite reports three `node:worker_threads` browser-externalisation advisories from PlayCanvas’s gsplat/draco worker implementations. These are build advisories rather than observed runtime failures.

No evidence of a duplicate PlayCanvas import or duplicate rendering engine was found. Manual Rollup micro-chunks were not introduced because they would fragment tightly coupled engine modules without reducing downloaded code and could destabilise scene startup. The existing advisory is retained and documented honestly.

## Runtime observations

- Per-frame 3D-to-screen projection mutates five element transforms directly instead of re-rendering React.
- Signal snapshots update at approximately two-second intervals.
- Label collision handling examines five labels and a fixed small candidate set.
- Camera presets and reset are immediate and remained responsive during local browser checks.
- The hosted Gaussian payload remains the principal network/runtime cost and is external to this bundle.

More formal performance work would require repeatable network throttling, device profiles, frame-time sampling, and a stable hosted payload contract. It should not trade away first-interaction reliability merely to silence the size advisory.
