# Hosted Scene Architecture

## Decision status

- **Decision date:** 2026-07-21
- **Recommended architecture:** Option C — a React application shell with a directly owned PlayCanvas Engine canvas.
- **Hosted-scene fallback:** Option A — the official SuperSplat iframe or scene-page link.
- **Implementation status:** the application-owned camera architecture supports five calibrated live overlays, seeded signal simulation, development-only depth-picker calibration, and transparent rule-based decision support.

The recommendation follows from the prototype's defining interaction requirement: five live HTML labels must remain aligned with world-space points while the visitor moves the camera. The application therefore needs a supported reference to the rendering camera and a 3D-to-screen projection API.

## Hosted scene information

| Item | Observed value |
| --- | --- |
| Public scene page | `https://superspl.at/scene/d1aa30ae` |
| Official embed viewer | `https://superspl.at/s?id=d1aa30ae` |
| Scene identifier | `d1aa30ae` |
| Scene title | `Smart Communal Room Digital Twin` |
| Visibility shown on scene page | `UNLISTED` |
| Published size shown on scene page | `6.65 MB` |
| Poster URL | `https://s3-eu-west-1.amazonaws.com/images.playcanvas.com/splat/d1aa30ae/v1/xl.webp` |
| Content metadata URL | `https://d28zzqy0iyovbz.cloudfront.net/d1aa30ae/v1/meta.json` |
| Experience Settings | Version 2 JSON injected inline into the hosted viewer page |
| Initial camera position | `[-1.8824180364608765, 0.7404446601867676, -1.3566683530807495]` |
| Initial camera target | `[0.6698105341858973, -1.1305490095121093, 2.498260341283213]` |
| Initial field of view | `65` degrees |

The official iframe snippet is:

```html
<iframe
  id="viewer"
  width="800"
  height="500"
  allow="fullscreen; xr-spatial-tracking"
  src="https://superspl.at/s?id=d1aa30ae"
></iframe>
```

The hosted page defines a default relative `settings` value of `./settings.json`, but the scene-specific settings are injected inline as `window.sse.settings`. The resolved default URL, `https://superspl.at/settings.json`, returned HTTP 404. No separately hosted, scene-specific settings JSON endpoint was identified. A direct application must therefore keep a reviewed local settings/hotspot configuration or introduce an explicitly maintained server-side retrieval step; it must not assume that `./settings.json` exposes this scene's settings.

The content metadata is an unbundled SOG version 2 document:

- HTTP payload: 12,268 bytes
- Gaussian count: 438,067
- Generator: `splat-transform v3.1.5`
- Referenced payloads: `means_l.webp`, `means_u.webp`, `scales.webp`, `quats.webp`, `sh0.webp`, `shN_centroids.webp`, and `shN_labels.webp`
- Combined advertised WebP size from HEAD responses: 6,961,764 bytes

The metadata document was the only scene-content body explicitly retrieved during endpoint inspection. The seven WebP payloads were checked with HEAD requests only.

## Verified application hotspot coordinates

[SuperSplat's annotation documentation](https://developer.playcanvas.com/user-manual/supersplat/studio/annotations/) defines annotation positions as world-space `[x, y, z]` coordinates. All five application anchors have been visually calibrated and verified:

| Intended signal | World-space position | Verified physical placement |
| --- | --- | --- |
| Temperature and Comfort | `[2.374005724971767, 0.1713414509993272, 0.38573660752531413]` | Visible front surface of the radiator |
| Occupancy | `[0.6972853074387108, 0.4001254978547795, -1.0362842602808375]` | Dense visible surface of the blue communal sofa |
| Lighting | `[1.0547874159695052, -1.118989273705962, 2.883436599269819]` | Red curtain and principal natural-light zone |
| Communal Appliance State | `[0.5041015695552176, -0.6157495764526498, 2.696243945339032]` | Non-essential communal countertop water boiler |
| Viewer Engagement | `[2.1830598647600628, 0.04883727340391779, 1.1292228642813638]` | Dining table and communal social focal zone |

The typed runtime configuration is checked against the reviewed JSON artifact. Live values, status rules, and accessible text remain application-owned and independently inspectable.

## Option A — official hosted iframe

### Supportable use

The iframe is the officially supplied embedding mechanism. The viewer response returned HTTP 200 and did not return `X-Frame-Options` or a Content Security Policy `frame-ancestors` restriction in the local HEAD check. It is also demonstrably embedded by the official [SuperSplat scene page](https://developer.playcanvas.com/user-manual/supersplat/scene-page/).

It provides hosted rendering, navigation, and the five static Studio annotations with minimal application code. Updates published in Studio appear in the hosted viewer automatically.

### Blocking limitation

In a separately hosted application the iframe is cross-origin. The parent application cannot read the iframe's PlayCanvas camera or call its camera component because of the browser same-origin policy. The official embedding documentation exposes URL parameters, but no documented `postMessage` camera-state or world-projection API was identified. The hosted bootstrap also keeps the returned viewer in a function-local `const` rather than publishing it as a parent-accessible API.

Therefore a fixed HTML layer placed over this iframe cannot remain aligned with world-space points. Option A is supportable only as a reduced-function fallback or link, not as the primary implementation of the five live spatial labels.

## Option B — `@playcanvas/supersplat-viewer`

### Supportable use

The official [SuperSplat Viewer package](https://www.npmjs.com/package/%40playcanvas/supersplat-viewer) was at version `1.27.1` during this review. It accepts a content URL and Experience Settings JSON, renders native annotations, and is explicitly intended for embedding or building a custom UI. The package also exports settings validation and migration helpers. See the official [viewer documentation](https://developer.playcanvas.com/user-manual/supersplat/viewer/) and [source repository](https://github.com/playcanvas/supersplat-viewer).

The hosted content URL is technically usable with this viewer. The Experience Settings can be retained locally after the annotation review.

### Limitation for live HTML hotspots

The documented package entry point exports the viewer's compiled HTML, CSS, and JavaScript as template strings, plus settings helpers. It does not document a stable application-facing viewer or camera object. At official repository commit [`f6378f066d803a7b9dd4b86e5eb78b03f8a37730`](https://github.com/playcanvas/supersplat-viewer/commit/f6378f066d803a7b9dd4b86e5eb78b03f8a37730), the internal `main` function returns a `Viewer`, but this is not part of the documented npm module surface.

A same-origin customized build could modify the official source and add projected labels, so the option is technically possible. It would, however, make the prototype depend on viewer internals rather than a supported projection contract. This is a weaker academic and maintenance boundary than using the Engine's public camera API.

## Option C — PlayCanvas Engine with an application-owned camera

### Supportable use

This is the recommended architecture. The official viewer itself passes the hosted `meta.json` URL to a PlayCanvas `gsplat` asset. PlayCanvas documents direct Engine-based splat applications in [Using the Engine API](https://developer.playcanvas.com/user-manual/gaussian-splatting/building/your-first-app/engine/), and the Engine supports unbundled SOG metadata and payload files.

Most importantly, the public [`CameraComponent.worldToScreen`](https://api.playcanvas.com/engine/classes/CameraComponent.html#worldToScreen) method converts each reviewed annotation coordinate to a canvas pixel position. The camera frustum can be used to suppress labels outside the view. A React application can own the surrounding dashboard and semantic HTML while a small Engine integration owns the canvas, scene asset, camera, and navigation.

The intended render loop is:

1. Load the hosted `meta.json` as a PlayCanvas `gsplat` asset.
2. Create an application-owned camera and navigation controls using the reviewed initial camera pose.
3. Store the five reviewed positions in a typed hotspot configuration.
4. On each rendered frame, project each position with `worldToScreen`, convert canvas pixels to CSS coordinates, and update lightweight transforms on the five HTML labels.
5. Hide labels that are behind the camera, outside the frustum, or intentionally occluded; constrain and de-conflict labels near viewport edges.
6. Mirror all five values, timestamps, statuses, and recommendations in a keyboard- and screen-reader-accessible list outside the canvas.

### Endpoint and deployment evidence

Tests from a localhost-style origin (`http://localhost:5173`) produced:

| Resource | Result |
| --- | --- |
| Scene page | HTTP 200 |
| Hosted iframe viewer | HTTP 200; HTML response; no observed frame-blocking header |
| Content `meta.json` | HTTP 200; `application/json`; `Access-Control-Allow-Origin: *`; `Access-Control-Allow-Methods: GET, HEAD`; byte ranges supported |
| Seven referenced WebP payloads | HTTP 200 to HEAD; `image/webp`; `Access-Control-Allow-Origin: *` on every response |
| Resolved default settings URL | HTTP 404; scene settings are inline instead |

This makes direct browser loading and true dynamic world-space HTML overlays feasible today. The main operational risk is that the versioned CloudFront URL was discovered from the hosted page rather than documented as a permanent public API contract. The application must show a useful loading error and retain the official iframe or scene-page link as a fallback if the endpoint or its CORS policy changes.

## Implemented architecture proof

The implementation uses a pnpm-managed React, TypeScript, Vite, and PlayCanvas Engine application. It uses `playcanvas@2.20.6` and the public Engine APIs rather than `@playcanvas/splat-transform` or undocumented SuperSplat Viewer internals.

The application loads `https://d28zzqy0iyovbz.cloudfront.net/d1aa30ae/v1/meta.json` as a `gsplat` asset. The metadata is validated as unbundled SOG version 2 before asset loading begins. PlayCanvas then resolves the referenced WebP payloads in the browser; no hosted asset is copied into this repository.

The application owns its camera and projects all five configured anchors through `CameraComponent.worldToScreen` in one PlayCanvas update loop. React updates only when the public signal snapshot changes, approximately every two seconds; per-frame projection and overlap reduction update element refs directly.

The current reviewed camera presets are:

| Preset | Position | Target | Field of view | Purpose |
| --- | --- | --- | ---: | --- |
| Overview / Reset | `[2.2100445893919587, -0.2767308084863921, 1.3845340034623583]` | `[1.1164654118219748, 0.34292948614091645, -0.6807790433292996]` | 65° | Presents the blue sofa, floor, door, and service counter together at an approachable eye-level angle. |
| Seating zone | `[1.0770533502079183, -0.3798981627225796, 0.8528692887307616]` | `[0.2554311281418149, 0.08566178816194962, -0.698830971818943]` | 62° | Frames the blue sofa and Occupancy hotspot. |
| Dining and kitchen zone | `[2.8808, -0.2425, 0.7978]` | `[1.247316085095261, -0.561799093685503, 2.236369909521817]` | 70° | Frames Lighting, the communal water boiler, and Viewer Engagement together. |

Each preset also stores a reviewed up vector so this source scan appears upright in the application coordinate system. Reset returns instantly to Overview; no cinematic movement or autoplay is used.

The labels are semantic HTML outside the canvas. They follow their projected anchors during mouse, touch, and keyboard navigation and are hidden when a point is behind the camera, outside the viewport, or the scene is not ready. A matching five-card text summary remains available outside the canvas.

Calibration is available only in a development build with `?calibrate=1`. That mode enables Gaussian Splat IDs before rendering, creates the official PlayCanvas `Picker` with depth support, and uses `getWorldPointAsync` to translate one armed canvas click into a world coordinate. The capture-phase placement gesture does not reach the orbit controller. Numeric inputs, nudge controls, verification state, clipboard export, and JSON download remain session-local; verified coordinates must be copied deliberately into the typed source configuration.

Browser smoke tests confirmed:

- the hosted splat reached its ready state and reported 438,067 Gaussians;
- all five label elements and all five matching accessible signal cards rendered;
- projected labels moved with camera navigation and returned to their initial projections after reset;
- out-of-view and behind-camera states hid labels correctly;
- pause, resume, and reset changed only the signal simulation, not camera navigation;
- depth picking placed a selected hotspot on a visible splat point without moving the camera;
- calibration edits, JSON generation, and hotspot reset worked, while the ordinary URL exposed no calibration panel;
- the official scene fallback link remained available;
- the layout had no horizontal overflow at 390 x 844 and stacked cleanly at 800 x 900;
- Overview, Seating zone, and Dining and kitchen zone presented the required room areas and hotspots;
- presentation mode kept the viewer, signals, scenarios, and active decisions together at 1440 x 900 and 1920 x 1080;
- no browser console warnings or errors were observed during the tested flows.

### Package and conversion-tooling policy

- Package manager: `pnpm@11.9.0` with a committed lockfile.
- Application dependency: `playcanvas@2.20.6`; React and Vite provide the accessible application shell and development build.
- TypeScript is pinned to `6.0.3`, which is within the supported peer range of the pinned `typescript-eslint` release.
- Vitest `4.1.10` provides deterministic unit coverage for simulation rules, status boundaries, formatting, hotspot validation, pause/reset behaviour, and calibration export.
- `@playcanvas/splat-transform`, its conversion command, and a `webgpu` build exception are absent from the application manifest and lockfile.
- Optional dependencies are disabled in `.npmrc`; `canvas` is also explicitly denied in the pnpm workspace build policy because it is an optional Node-only helper and is not needed by this browser application.
- Conversion tooling is not part of the application package; no conversion command should be run for this hosted-scene architecture.

## Fallback and limitations

- **Primary:** application-owned PlayCanvas Engine canvas loading the hosted unbundled SOG, with dynamic HTML labels projected from reviewed world coordinates.
- **Fallback:** official iframe or direct scene-page link. In fallback mode, expose the live values in the surrounding accessible dashboard and use the hosted static annotations, while clearly stating that custom labels cannot track the iframe camera.
- **Settings synchronization:** Studio settings are inline, not available at a stable per-scene JSON endpoint. Changes made in Studio require a deliberate review and update of the local configuration.
- **Hosted-content stability:** CORS and all referenced files are currently accessible, but the discovered CloudFront URL is an external runtime dependency.
- **Privacy:** the unlisted scene is still accessible to anyone with its URL and depicts a real physical room. Review the hosted scene, annotation text, screenshots, and any future deployment before public release.

## Current implementation status

The hosted viewer, five calibrated overlays, transparent decision-support layer, presentation mode, repository evidence, academic write-up, walkthrough, automated checks, and GitHub Pages deployment are complete. Future work focuses on stakeholder evaluation, validated sensor integration, and hosted-scene resilience.
