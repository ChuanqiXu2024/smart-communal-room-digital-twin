# Requirements Traceability

This document maps each task requirement to evidence in the public project.

| Task requirement | Status | Concrete evidence |
| --- | --- | --- |
| Photorealistic browser-navigable Gaussian Splat reconstruction | Complete | The [live prototype](https://chuanqixu2024.github.io/smart-communal-room-digital-twin/) renders the hosted 438,067-Gaussian room with mouse, touch, keyboard, reset, and three guided views. No scene payload is stored in Git. |
| Five live spatial overlays | Complete | The [live prototype](https://chuanqixu2024.github.io/smart-communal-room-digital-twin/) projects five calibrated labels from reviewed world-space anchors and provides matching accessible signal cards. |
| Realistically simulated values with noise | Complete | [Data-simulation documentation](data-simulation.md) records the fixed seed, bounded mean reversion, update rates, noise, provenance, and engagement-proxy limitations. |
| Two or more actionable recommendations | Complete | The [Combined viewing intervention](https://chuanqixu2024.github.io/smart-communal-room-digital-twin/) activates exactly two actionable recommendations; four rules are available overall. |
| Transparent decision layer | Complete | [Decision-layer documentation](decision-layer.md) records exact thresholds, stability behaviour, evidence, actions, expected outcomes, and human-review limits. |
| Documented GitHub repository | Complete | The [public repository](https://github.com/ChuanqiXu2024/smart-communal-room-digital-twin) contains architecture, data, calibration, privacy, accessibility, testing, traceability, citation, and release evidence. |
| 5–8 minute screen-recorded walkthrough | Complete | The verified [unlisted YouTube walkthrough](https://youtu.be/JQQHfM-ZF4s) is accessible without repository credentials. |
| One-page peer-reviewed academic write-up | Complete | The final [one-page academic write-up](write-up/digital-twin-student-accommodation-write-up.pdf) contains the research motivation, student-accommodation application, contribution, limitations, and peer-reviewed references. |
| Live public deployment | Complete | The [normal interface](https://chuanqixu2024.github.io/smart-communal-room-digital-twin/) and [presentation mode](https://chuanqixu2024.github.io/smart-communal-room-digital-twin/?present=1) are deployed through GitHub Pages. |

## Public deployment evidence

- [Public source repository](https://github.com/ChuanqiXu2024/smart-communal-room-digital-twin)
- [Live prototype](https://chuanqixu2024.github.io/smart-communal-room-digital-twin/)
- [Presentation mode](https://chuanqixu2024.github.io/smart-communal-room-digital-twin/?present=1)
- [Continuous-integration workflow](https://github.com/ChuanqiXu2024/smart-communal-room-digital-twin/actions/workflows/ci.yml)
- [GitHub Pages workflow](https://github.com/ChuanqiXu2024/smart-communal-room-digital-twin/actions/workflows/pages.yml)
- [Project deliverables](project-deliverables.md)

## Protected evidence boundaries

- The private source PLY remains under the ignored `source-private/` directory and is not inspected, copied, staged, committed, or distributed by this public project.
- No hosted SOG metadata payload, Gaussian payload, or other hosted scene file is tracked in the repository.
- Verified hotspot coordinates and exact decision thresholds are unchanged.
- Browser automation tests application-owned behaviour without bundling the hosted scene; real hosted rendering is checked separately against the live deployment.
