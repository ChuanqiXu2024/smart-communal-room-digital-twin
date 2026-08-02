# Privacy and Ethics

## Review outcome

The room-scene privacy review passed with no changes requested. This result applies to the reviewed unlisted scene and verified hotspot placements. Public publication remains a separate decision because the scene and screenshots digitally represent a real physical room.

## Data and distribution boundaries

- The original PLY remains private, excluded from Git, and absent from this repository’s tracked history.
- The application does not bundle or distribute a local Gaussian Splat payload.
- The runtime room is hosted externally as an unlisted SuperSplat scene. Unlisted does not mean access-controlled: anyone with the URL may view it.
- The repository contains source code, documentation, safe calibration coordinates, and reviewed screenshots only.
- No real environmental sensor data, property-management data, tenant data, or other personal data are collected.

## Engagement proxy

Viewer Engagement is derived from application camera navigation: whether its reviewed focal point is visible, its viewport centrality, and dwell time, with smoothing and small seeded noise. It does not inspect a user through a camera or microphone and does not perform biometric identification, facial analysis, gaze tracking, emotion recognition, demographic inference, or identity profiling.

The proxy is a demonstration feature, not a validated measure of attention, preference, satisfaction, emotion, rental intent, or wellbeing. Scenario mode can temporarily override it with a disclosed deterministic value.

## Recommendation limits

The four rules operate on simulated values and are not validated property-management policy. Their recommendations must be reviewed by a person who understands the property and operational context.

In particular, the device-use rule applies only to the selected non-essential communal countertop water boiler. A person must confirm vacancy, current need, and safe switching before acting. The rule must not be applied to refrigeration, safety systems, heating controls, medical equipment, or other essential devices.

The application permanently states that recommendations support, but do not replace, human property-management judgement. It does not automatically control equipment, contact people, approve a rental, or take an operational action.

## Publication checklist

Before public deployment:

1. Review the hosted scene and every repository screenshot for identifying or sensitive room details.
2. Confirm the project owner has authority to publish the digital representation.
3. Decide whether the unlisted scene URL may be disclosed by the public application.
4. Confirm that Git commit identity exposure is acceptable.
5. Recheck that no source scan or hosted scene payload is tracked.
6. Document the reviewed deployment URL and reuse terms.

If the room or its privacy context changes, repeat the review.
