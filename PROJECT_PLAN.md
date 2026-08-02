# Project Plan

## Goal and success criteria

Deliver a transparent, well-documented research prototype that lets a renter or property-service stakeholder navigate a photorealistic communal-room Gaussian Splat, inspect five spatially anchored live signals, and receive reproducible, explainable recommendations. The final repository includes the verified 5–8 minute walkthrough, one-page academic write-up, and project deliverables.

## Completed technical milestones

- [x] Hosted-scene architecture proof and application-owned PlayCanvas camera.
- [x] Five responsive spatial live-signal overlays.
- [x] Visual calibration and verification of all five physical hotspot positions.
- [x] Transparent decision support with four rules, six reproducible scenarios, and transition logging.
- [x] Bounded local checks plus GitHub-hosted unit, browser, and accessibility validation.
- [x] Public GitHub Pages deployment and final public smoke test.
- [x] One-page academic write-up, recorded walkthrough, and complete project package.

## Phase 0 — Repository and source safeguards

**Status:** Complete.

- Ignore the private scan, dependencies, generated builds, local configuration, and temporary files.
- Preserve the original PLY without editing, moving, publishing, or committing it.
- Maintain reviewable project instructions and verification expectations.

**Exit evidence:** the private source remains ignored and untracked; only safe application and documentation files are eligible for Git.

## Phase 1 — Technical discovery and hosted-scene architecture

**Status:** Complete.

- Select the application-owned PlayCanvas Engine architecture.
- Verify hosted SOG metadata, payload access, CORS, and fallback behaviour.
- Define privacy and deployment boundaries.
- Retain the official hosted scene as a fallback.

**Exit evidence:** the architecture decision and hosted endpoint findings are documented; the room-scene privacy review passed.

## Phase 2 — Browser viewer and navigation

**Status:** Complete through the hosted unlisted scene architecture.

- Load the hosted Gaussian Splat without adding a local hosted-scene payload.
- Provide mouse, touch, and keyboard navigation.
- Provide a calibrated initial camera, reset control, loading state, error state, and hosted-scene fallback.
- Preserve responsive viewer dimensions.

**Exit evidence:** the scene renders and remains navigable at desktop, tablet, and mobile viewports.

## Phase 3 — Five calibrated spatial live signals

**Status:** Complete.

- Present temperature, occupancy, lighting, communal water-boiler state, and interaction-derived engagement.
- Anchor all five signals to approved world positions.
- Provide accessible matching signal cards, values, status, provenance, freshness, and spatial-zone descriptions.
- Use deterministic bounded simulation and disclose simulated values.
- Keep the engagement proxy explicitly non-biometric.

**Exit evidence:** all five overlays update and remain attached during navigation; all coordinates are verified and match the approved calibration artifact.

## Phase 4 — Transparent decision support

**Status:** Complete.

- Evaluate four pure typed rules with exact documented thresholds.
- Show evidence, explanation, action, expected outcome, involved signals, and human-review limitations.
- Require two consecutive ordinary updates before recommendation activation or deactivation.
- Provide six seeded scenarios, including a two-recommendation combined intervention.
- Record only recommendation and mode transitions in a 20-entry session log.
- Keep the water-boiler rule specific to the selected non-essential device.

**Exit evidence:** normal and boundary states are tested, each rule can be triggered reproducibly, the combined scenario shows Rules 1 and 2 together, and noisy variation cannot change a scenario's expected rule set.

## Phase 5 — Integrated responsive and accessible experience

**Status:** Public implementation and documented manual accessibility review complete, with recorded minor limitations.

- Maintain clear separation between simulated observations and recommendations.
- Preserve keyboard access, focus visibility, text alternatives, non-colour highlighting, and reduced-motion support.
- Validate mobile, tablet, and desktop layouts.
- Maintain project-owned Playwright and axe checks.
- A formal conformance claim would require named screen-reader, forced-colour, and user evaluation.

## Phase 6 — Verification and evaluation

**Status:** Local, CI, GitHub Pages, and public smoke-test verification complete. Formal stakeholder evaluation remains future research and is outside the current project scope.

- Retain unit coverage for simulation, scenarios, decisions, transitions, calibration, and formatting.
- Record production bundle advisories and hosted-runtime dependencies.
- Retain functional browser, responsive, presentation-mode, fallback, and accessibility automation in CI.
- Retain structured renter and property-service task evaluation as future research.
- Document limitations, threats to validity, and future work.

## Phase 7 — Repository and academic presentation

**Status:** Complete. The repository package, deployment, write-up, and walkthrough are ready for external review.

- [x] Complete the repository audit, public release, and deployment metadata.
- [x] Run CI and GitHub Pages workflows and verify the deployed normal and presentation views.
- [x] Complete the final public acceptance, screenshot, and room privacy review.
- [x] Prepare and verify the 5–8 minute unlisted walkthrough.
- [x] Prepare and verify the one-page academic write-up with peer-reviewed references.
- [x] Assemble and review the final repository package.

## Remaining project task

- [ ] Send the completed project deliverables.

## Cross-cutting decisions

- Viewer: PlayCanvas Engine with an application-owned camera and hosted unbundled SOG v2.
- Signals: five verified world-space anchors with simulated or interaction-derived provenance.
- Decision method: transparent rules rather than unnecessary machine learning.
- Device boundary: selected non-essential communal countertop water boiler only.
- Privacy: private PLY excluded; hosted-scene and screenshot privacy review passed for the reviewed public deployment.
- Accessibility and performance: preserve non-canvas equivalents, responsive operation, reduced motion, and documented bundle/runtime limitations.
