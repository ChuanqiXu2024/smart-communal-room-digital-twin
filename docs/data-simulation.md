# Data Simulation

## Purpose and disclosure

The prototype publishes a signal snapshot approximately every two seconds. Values are realistic demonstrations, not measurements. No real sensor, biometric, identity, emotion-recognition, demographic, or other personal data are collected.

Viewer Engagement is an interaction-derived navigation proxy. It describes camera orientation relative to the verified dining-table and social-zone anchor; it does not describe the viewer's internal state.

## Reproducibility

`SignalSimulation` uses a deterministic seeded pseudo-random generator with default seed `0x5eed2026`. Live-baseline reset operations restore the seed and documented initial values. Each scenario uses a stable seed offset, so selecting the same scenario produces the same bounded sequence.

Browser timestamps identify when snapshots are produced and are not part of the random sequence.

## Live-baseline signals

| Signal | Initial value | Bounds | Ordinary two-second behaviour | Status thresholds |
| --- | ---: | ---: | --- | --- |
| Temperature | 22.4°C | 18.0–28.0°C | Mean reverts toward 22.2°C with seeded noise; maximum step 0.2°C | Cool below 20; Comfortable 20–24 inclusive; Warm above 24 |
| Occupancy | 2 people | Integers 0–6 | Low-probability transition after a dwell period; changes by at most one | Vacant at 0; Light use 1–2; Moderate use 3–4; Busy 5–6 |
| Lighting | 430 lux | 100–800 lux | Mean reverts toward 450 lux with seeded noise; maximum ordinary step 25 lux | Low below 350; Adequate 350–650 inclusive; Bright above 650 |
| Communal Appliance State | ON | ON/OFF | Remains ON in the ordinary baseline | Active when ON; Inactive when OFF |
| Viewer Engagement | 68/100 | 0–100 | Smoothed camera visibility, centrality, and dwell target with seeded noise; maximum ordinary step 4 | Low below 60; Moderate 60–75 inclusive; High above 75 |

The appliance is the selected non-essential communal countertop water boiler. It is not a refrigerator, safety device, heating control, or essential continuously powered appliance.

## Engagement-proxy calculation

The projection loop samples the verified dining-table hotspot without updating React every frame:

1. Determine whether the anchor is ready, in front of the camera, and within the viewport margin.
2. Convert distance from viewport centre into centrality from 0 to 1.
3. Accumulate dwell while visible with centrality above 0.35; otherwise decay the accumulator.
4. Every two seconds, target `58 + 22 × centrality + 15 × dwellFactor` while visible, or `42` while hidden.
5. Move 18% toward the target, add small seeded noise, clamp the step to ±4, round, and bound the result to 0–100.

This proxy has not been validated as a behavioural measure and must not be used as one.

## Scenario mode

The six documented demonstration scenarios set exact initial targets, reseed variation deterministically, and keep every later value within a safe band. Those bands are selected so ordinary scenario variation cannot cross a decision threshold or change the scenario's expected rule set.

While a scenario is selected, Viewer Engagement follows the scenario band and temporarily ignores camera observations. The interface discloses this override. Returning to live baseline restores camera-derived engagement immediately.

## Control semantics

- **Pause:** freezes automatic signal updates in the current mode; camera navigation continues.
- **Resume:** continues deterministic variation in the current mode.
- **Return to live baseline:** restores the ordinary simulator, its initial values, and camera-derived engagement.
- **Reset to normal:** selects the Normal communal use scenario, restores its exact target, resets its seeded sequence, and resumes updates.
- **Select scenario:** sets its exact target immediately; automatic variation continues on later ticks.

Explicit scenario and mode changes update recommendations immediately. Ordinary noisy updates use the separately documented two-update decision-stability rule.

## Limitations

- The simulator does not model real weather, sensors, building controls, time of day, or events.
- Occupancy is not a person detector.
- Lighting is not a calibrated lux measurement.
- Water-boiler state is illustrative and does not control the physical device.
- Engagement depends on navigation and is not a measure of interest, intent, emotion, or identity.
