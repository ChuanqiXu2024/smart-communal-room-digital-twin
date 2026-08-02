# Accessibility Review

Review date: 2026-07-26.

This review records accessibility evidence for the public release; it does not claim full WCAG conformance.

## Automated results

The project pins Playwright `1.61.1` and `@axe-core/playwright` `4.12.1`. Four Chromium checks cover ordinary desktop, 1920 × 1080 presentation mode, 390 × 844 mobile mode, and the Combined viewing intervention state.

| Mode | Axe violations | Serious / critical | Moderate | Incomplete checks |
| --- | ---: | ---: | ---: | --- |
| Ordinary desktop | 0 | 0 | 0 | 2 |
| Presentation | 0 | 0 | 0 | 2 |
| Mobile | 0 | 0 | 0 | 2 |
| Combined recommendation | 0 after remediation | 0 | 0 after remediation | 2 |

The initially reported moderate `landmark-unique` finding in the combined state came from repeated labelled nested sections in two recommendation cards. Removing unnecessary nested landmark labels resolved it without removing headings or content.

The two incomplete rules are `aria-prohibited-attr` and `color-contrast`. They require human judgement because five temporarily hidden projected buttons change ARIA state imperatively with scene visibility, and WebGL/poster content plus layered state styling cannot be fully evaluated from static computed colours. No incomplete result is counted as a pass.

## Manual checklist

| Check | Result | Evidence / remaining judgement |
| --- | --- | --- |
| Keyboard navigation | Pass for tested flow | Header controls, camera presets, canvas, label toggle, spatial-zone actions, scenario controls, disclosure, event toggle, and links are keyboard reachable. Canvas keys provide orbit, pan, zoom, and reset. |
| Visible focus | Pass for tested flow | `:focus-visible` styling is present on controls, links, cards, and the canvas, and was verified in the public target browser. |
| Heading hierarchy | Pass | One page-level `h1`; panel `h2` headings; card `h3` headings; evidence/action `h4` headings. |
| Colour contrast | Automated incomplete; manually acceptable in sampled states | Text is not conveyed by colour alone. Hosted-image overlap and operating-system/browser-specific contrast combinations remain limitations beyond the sampled review. |
| Reduced motion | Pass by design | Camera preset changes are instant; no cinematic motion or autoplay is used. CSS disables nonessential animation/transition under `prefers-reduced-motion: reduce`. |
| Zoom and text scaling | Pass at 200% for tested responsive layouts; further AT testing recommended | No page-level horizontal overflow at 390 × 844 or 800 × 900. Text reflows, the mobile viewer remains usable, and the public interface passed a manual 200% browser-zoom review. |
| Screen-reader labelling | Pass for application controls; canvas is limited | Controls have accessible names and pressed/expanded states. Signal and recommendation panels provide non-canvas equivalents. Dynamic sensor ticks are not disruptive live announcements. |
| WebGL/canvas fallback | Pass | The canvas contains fallback text; the surrounding interface retains signals and decisions; typed errors expose retry and the official scene link. |

## Canvas-specific considerations

The Gaussian Splat is visual and does not expose a semantic model of furniture or geometry. The five projected labels are HTML and have equivalent signal cards outside the canvas, but a screen reader cannot independently explore the room geometry. Camera instructions are linked to the canvas, and application content remains useful when the hosted scene fails.

Keyboard focus on a visible spatial label highlights the matching signal card. Labels that are behind the camera, out of view, hidden by the master control, or waiting for scene readiness are removed from sequential focus. Narrow layouts prioritise title and value while the live-signal panel retains status, source, and spatial-zone details.

## Unresolved limitations

- A basic screen-reader review was completed, but no formal session with NVDA, JAWS, VoiceOver, or TalkBack has been conducted.
- No user study with disabled participants has been completed.
- Geometry itself has no text-based room tour or structured scene description.
- Axe’s incomplete ARIA and contrast checks remain limitations for broader browser and operating-system combinations.
- The reviewed release passed manual checks for 200% browser zoom, forced colours, keyboard navigation, and basic screen-reader use; broader assistive-technology and operating-system combinations remain outside this evaluation.
