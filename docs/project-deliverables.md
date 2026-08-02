# Smart Communal Room Digital Twin — Project Deliverables

**Author:** Chuanqi Xu

**Version:** 0.1.0

## Overview

This academic prototype presents a browser-navigable Gaussian Splat reconstruction of a student-accommodation communal room with five calibrated spatial signals. Seeded, bounded simulated values and a navigation-derived engagement proxy feed a transparent rule layer that produces inspectable property-service and rental-viewing recommendations, always subject to human review.

## Direct links

- [Live prototype](https://chuanqixu2024.github.io/smart-communal-room-digital-twin/)
- [Presentation mode](https://chuanqixu2024.github.io/smart-communal-room-digital-twin/?present=1)
- [Unlisted screen-recorded walkthrough](https://youtu.be/JQQHfM-ZF4s)
- [One-page academic write-up](write-up/digital-twin-student-accommodation-write-up.pdf)
- [Public source repository](https://github.com/ChuanqiXu2024/smart-communal-room-digital-twin)

## Technical-requirement mapping

| Technical requirement | Project evidence |
| --- | --- |
| Photorealistic browser-navigable reconstruction | The live PlayCanvas viewer renders an externally hosted 438,067-Gaussian communal-room reconstruction with mouse, touch, keyboard, reset, and three guided views. |
| Five live spatial overlays with realistically noisy values | Five calibrated HTML labels track reviewed world positions; matching accessible cards expose seeded, bounded simulated environmental signals and the navigation-derived engagement proxy. |
| Decision support with at least two actionable recommendations | Four transparent rules expose exact evidence, actions, outcomes, and limitations; the Combined viewing intervention scenario reproducibly activates two recommendations. |

## Privacy, simulation, and human review

- The original source scan remains private, ignored, untracked, and absent from the repository and release.
- The hosted room and release screenshots passed the documented privacy review; the unlisted hosted scene remains accessible to anyone who has its URL.
- Environmental values are simulated demonstration data, not live building measurements.
- Viewer Engagement is a navigation-based interaction proxy. It is not biometric, demographic, identity, emotion, camera, or microphone analysis.
- Recommendations support, but never replace, human property-management judgement and real-world condition checks.

## Known limitations

- The reconstruction covers one communal room and is not a metrically validated building survey.
- Signals are simulated rather than connected to operational IoT sensors.
- Rule thresholds are demonstrative and have not been validated as operating policy.
- The engagement signal is a navigation proxy, not a validated measure of attention, preference, or rental intent.
- No resident or accommodation-manager evaluation has been conducted.
- Runtime rendering depends on an external hosted scene and its current availability and CORS behaviour.
