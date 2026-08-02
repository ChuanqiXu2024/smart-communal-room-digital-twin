# Release Checklist

Status date: 2026-08-02. Checked items are verified against the final public release.

## Engineering

- [x] Frozen dependency installation succeeds.
- [x] TypeScript checking succeeds.
- [x] ESLint succeeds.
- [x] Unit tests succeed.
- [x] Production build succeeds.
- [x] Project-owned Playwright functional checks succeed.
- [x] Automated axe checks have no serious or critical findings.
- [x] Ordinary and GitHub Pages subpath previews are locally smoke-tested.
- [x] Camera presets, reset, labels, all scenarios, event collapse, loading, retry, and fallback are covered.
- [x] No horizontal page overflow is observed at required viewports.

## Accessibility

- [x] Automated desktop, presentation, mobile, and active-recommendation checks are recorded.
- [x] Keyboard, focus, hierarchy, reduced-motion, responsive, labelling, and canvas fallback review is documented.
- [x] Complete final 200% zoom, forced-colours, keyboard, and basic screen-reader reviews; recorded minor limitations remain documented.

The project does not claim full WCAG conformance without broader manual and user evaluation.

## Privacy and content

- [x] Room-scene privacy review passed with no changes requested.
- [x] The source PLY remains ignored and untracked.
- [x] No local or hosted scene payload is tracked.
- [x] The application discloses simulation, engagement-proxy limits, and required human review.
- [x] Public source and documentation contain no personal email address or absolute local path.
- [x] Review the hosted room and screenshots for public access immediately before deployment.
- [x] Confirm the verified GitHub noreply commit identity is used for public exposure.

## Availability and publication

- [x] Hosted scene availability and browser rendering are locally verified.
- [x] Loading failure, retry, and official hosted-scene fallback are implemented.
- [x] Stable release screenshots are stored under `docs/screenshots/`.
- [x] CI and GitHub Pages workflows are prepared with least-privilege permissions.
- [x] Create the public GitHub repository.
- [x] Add and verify the publication remote.
- [x] Push `main` after final review.
- [x] Enable GitHub Pages with GitHub Actions and verify its public URL.
- [x] Complete the public normal-mode and presentation-mode smoke test.
- [x] Complete the final screenshot and room privacy review.
- [x] Add the verified deployment URL to README and citation metadata.

## Academic delivery

- [x] Add peer-reviewed references.
- [x] Prepare and review the one-page academic write-up.
- [x] Verify the public write-up link target and stable filename.
- [x] Record and review the 5–8 minute walkthrough.
- [x] Verify the unlisted walkthrough link in a public browser context.
- [x] Assemble the final project package.
- [x] Create and push the annotated `v0.1.0` tag after CI and Pages succeed.
- [x] Create the GitHub Release and attach the final PDF if supported.
- [ ] Send the completed project deliverables.

The completed repository and `v0.1.0` release are ready. Sending the completed project deliverables remains the only outstanding task.
