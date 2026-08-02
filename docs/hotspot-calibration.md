# Hotspot Calibration

## Approved calibration

All five application hotspots were visually reviewed against the hosted room and are verified. The approved reproducibility artifact is [`calibration/approved-hotspot-calibration.json`](calibration/approved-hotspot-calibration.json).

| Hotspot | Approved world position `[x, y, z]` | Verified physical placement |
| --- | --- | --- |
| Temperature and Comfort | `[2.374005724971767, 0.1713414509993272, 0.38573660752531413]` | Visible front surface of the radiator |
| Occupancy | `[0.6972853074387108, 0.4001254978547795, -1.0362842602808375]` | Dense visible surface of the blue communal sofa |
| Lighting | `[1.0547874159695052, -1.118989273705962, 2.883436599269819]` | Red curtain representing the principal natural-light zone |
| Communal Appliance State | `[0.5041015695552176, -0.6157495764526498, 2.696243945339032]` | Non-essential communal countertop water boiler |
| Viewer Engagement | `[2.1830598647600628, 0.04883727340391779, 1.1292228642813638]` | Dining table representing the communal social and viewing focal zone |

The privacy review for the hosted room and these placements passed with no requested changes. The JSON artifact contains no imagery, private scan content, local path, or source-PLY information.

## Safety boundary

Calibration is a development-only browser workflow. It changes in-memory application state only and never edits repository files, the private scan, or the hosted scene.

Any future recalibration result remains a review candidate until the project owner approves it and deliberately updates the typed source configuration and approved JSON artifact.

## Open calibration mode

Start the development server:

```powershell
pnpm run dev
```

Then open:

```text
http://127.0.0.1:4173/?calibrate=1
```

The query parameter is honoured only when `import.meta.env.DEV` is true. A production build does not expose the calibration panel or create a picker.

## How splat picking works

The application determines calibration mode before rendering and enables `app.scene.gsplat.enableIds`. It creates the official PlayCanvas `Picker` with depth enabled and resizes its pick buffer with the canvas.

When placement is armed, the next canvas pointer gesture is intercepted before the camera controller. The picker prepares an off-screen ID/depth render from the application-owned camera and calls `getWorldPointAsync` at the selected canvas coordinate. A successful result updates the session coordinate immediately. A missing depth value or error preserves the previous coordinate and displays an explanation.

The picker, resize observer, pointer listeners, and PlayCanvas application are disposed when the viewer unmounts.

## Place, refine, and export

1. Choose a hotspot.
2. Select **Place selected hotspot**.
3. Click the intended visible physical feature.
4. Review the returned X/Y/Z position and attached label.
5. Use numeric inputs or `±0.01`, `±0.1`, and `±1.0` nudges when required.
6. Inspect the position from several camera angles.
7. Mark it verified only after visual review.
8. Copy the coordinate, copy all JSON, or download the calibration JSON.

Exported records include the hotspot ID, title, three-number position, verification status, note, timestamp, schema version, and scene ID. Export validation rejects missing, duplicate, reordered, mismatched, or non-finite hotspot data.

## Apply a reviewed recalibration

Browser calibration never edits the repository automatically. A reviewed update must be copied deliberately into both:

- `src/config/hotspots.ts`;
- `docs/calibration/approved-hotspot-calibration.json`.

Preserve exact coordinate precision, required order, verified status, and approved physical-placement notes. Then run:

```powershell
pnpm run typecheck
pnpm run lint
pnpm run test
pnpm run build
```
