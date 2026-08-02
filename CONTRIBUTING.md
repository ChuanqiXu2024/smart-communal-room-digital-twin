# Development Guidelines

## Project objective

This repository contains the research prototype **Smart Communal Room Digital Twin for Rental Viewing and Property-Service Decision Support**. It combines a browser-navigable, photorealistic Gaussian Splat reconstruction of a communal room with five spatial live-data overlays and an explainable decision layer that produces actionable recommendations.

## Source-scan protection

- Everything under `source-private/` is private source material.
- The original PLY must not be edited, renamed, moved, compressed, converted, uploaded, published, or committed.
- Derived assets must be written elsewhere without modifying the source.
- Derived scan assets require a privacy review and project-owner approval before publication.
- `source-private/` must remain excluded from Git, and that exclusion must be verified before committing scan-related assets.

## Code quality and academic review

- Contributions should favour clear, small modules and descriptive names over opaque abstractions.
- Data generation, spatial mapping, rendering, and recommendation logic should remain separable so each can be inspected and evaluated.
- Important assumptions, coordinate transforms, thresholds, data provenance, simulation methods, and architectural decisions should be documented.
- Simulated data and noise models should be reproducible where practical and clearly labelled in the interface and documentation.
- Dependencies should remain intentional, with relevant sources and licences recorded for academic review or redistribution.

## Accessibility and responsive design

- Support keyboard operation, visible focus states, semantic controls, readable contrast, and accessible names and status announcements.
- Do not rely on colour alone to communicate sensor state or recommendations.
- Provide usable supporting text for information presented inside the 3D canvas.
- Respect reduced-motion preferences and avoid interactions that require precise pointer control only.
- Keep overlays and controls legible and operable from narrow mobile screens to large desktop displays.

## Verification

- Implementation changes should include the relevant build and available automated checks.
- Rendering, interaction, accessibility, and responsive-layout changes should also be verified in a browser.
- Document the checks run, their results, and any checks that could not be completed.
- A milestone is complete only after its documented acceptance checks pass.
