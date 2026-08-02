# Transparent Decision Layer

## Design rationale

The prototype uses explicit typed rules because the required relationships are small, known, and threshold based. A rule engine makes every trigger, evidence value, action, and limitation directly inspectable. Machine learning would add unnecessary opacity without an appropriate training dataset, validated outcome label, or academic justification.

The output is decision support, not autonomous property management. Every recommendation requires human review.

## Rule definitions

| Rule | Exact condition | Priority | Category | Involved signals |
| --- | --- | --- | --- | --- |
| Warm and occupied | Temperature `> 24°C` **and** occupancy `>= 3` | High | Comfort and viewing readiness | Temperature, occupancy |
| Poor presentation conditions | Lighting `< 350 lux` **and** engagement `< 60/100` | Medium | Viewing experience | Lighting, engagement |
| Avoidable non-essential device use | Occupancy `== 0` **and** communal water boiler `ON` | Medium | Operational efficiency | Occupancy, appliance |
| Strong interest in the social zone | Engagement `> 75/100` | Opportunity | Rental marketing | Engagement |

Thresholds are strict where shown. Exactly 24°C, 350 lux, 60/100 engagement, or 75/100 engagement does not activate the corresponding strict comparison.

### Rule 1 — Prepare ventilation before the next viewing

- Evidence includes current temperature against 24°C and current occupancy against 3.
- Actions: improve ventilation; reduce unnecessary heating; avoid simultaneous group viewings while the room remains warm where appropriate; confirm comfort before the next viewing.
- Expected outcome: improved resident comfort and a more favourable property-viewing experience.

### Rule 2 — Improve presentation of the communal focal zone

- Evidence includes current lux against 350 and engagement against 60/100.
- Actions: open curtains where appropriate; improve ambient or task lighting; declutter or restage the dining/social area; review the viewing introduction.
- Expected outcome: improved visual presentation and stronger attention to the communal-room proposition.

### Rule 3 — Review the unused communal water boiler

- Evidence includes simulated vacancy and the ON state of the monitored communal countertop water boiler.
- Actions: confirm vacancy; confirm the boiler is not needed; confirm it is safe to switch off; switch it off only after all checks.
- Expected outcome: reduced avoidable energy consumption without affecting essential equipment.
- Safety boundary: this rule applies only to the selected non-essential communal countertop water boiler. It never recommends switching off refrigerators, safety equipment, heating controls, or essential continuously powered devices.

### Rule 4 — Feature the communal social zone in the rental proposition

- Evidence includes the interaction-derived engagement proxy against 75/100.
- Actions: emphasise the dining/social area in the listing; feature it in the viewing script; consider stronger photography or amenity descriptions.
- Expected outcome: better alignment between the property proposition and the area attracting the strongest navigational attention.
- Limitation: the proxy is not biometric, identity, demographic, or emotion analysis.

## Evidence and recommendation shape

Every evaluated rule has a stable ID, active status, title, priority, category, involved signal IDs, current-value evidence, explanation, actions, expected outcome, and human-review limitation. The interface renders only active recommendation cards but exposes all four thresholds under **How decisions are generated**.

When no rule is active, the interface states:

> No intervention is currently triggered under the demonstration rules.

## Stability mechanism

Underlying rules are evaluated on every public signal snapshot. An ordinary condition must persist for two consecutive updates before an activation or deactivation is accepted. A single noisy sample therefore cannot flicker a recommendation.

Explicit scenario selection, reset-to-normal, and return-to-live-baseline are deliberate reproducible actions, so their expected rule states are applied immediately. The exact rule thresholds do not change.

## Demonstration scenarios

| Scenario | Exact target `(temperature, occupancy, lighting, boiler, engagement)` | Bounded variation | Expected active rules |
| --- | --- | --- | --- |
| Normal communal use | `22.4°C, 2, 430 lux, ON, 68` | `22.2–22.6°C`; occupancy `2`; `410–450 lux`; `ON`; engagement `65–71` | None |
| Warm and crowded | `25.2°C, 4, 430 lux, ON, 68` | `25.0–25.4°C`; occupancy `4`; `410–450 lux`; `ON`; engagement `65–71` | Rule 1 |
| Poor presentation | `22.0°C, 1, 250 lux, ON, 52` | `21.8–22.2°C`; occupancy `1`; `235–265 lux`; `ON`; engagement `49–55` | Rule 2 |
| Vacant room with water boiler left on | `21.5°C, 0, 430 lux, ON, 50` | `21.3–21.7°C`; occupancy `0`; `410–450 lux`; `ON`; engagement `47–53` | Rule 3 |
| Strong interest | `22.2°C, 2, 500 lux, ON, 82` | `22.0–22.4°C`; occupancy `2`; `480–520 lux`; `ON`; engagement `79–85` | Rule 4 |
| Combined viewing intervention | `25.2°C, 4, 250 lux, ON, 52` | `25.0–25.4°C`; occupancy `4`; `235–265 lux`; `ON`; engagement `49–55` | Rules 1 and 2 |

Scenario selection sets the exact target and a stable seed. Subsequent two-second updates use small mean-reverting variation clamped to the stated bands. Scenario engagement temporarily overrides the normal camera-derived proxy and is labelled in the interface.

## Recent decision events

The event model records transitions only:

- recommendation activation;
- recommendation deactivation;
- scenario change;
- return to live baseline.

Each event contains local display time, machine-readable event type, rule or scenario title, and concise evidence/state summary. Repeated two-second evaluations do not duplicate a stable recommendation. The newest 20 events are held in memory, can be cleared, and are never persisted outside the browser session. Initial page load does not log inactive recommendations.

Reset selects Normal communal use and logs that scenario change only when it changes the current mode. Return to live baseline creates one explicit return event and restores ordinary camera-derived engagement.

## Human-review limitation

The interface permanently states:

> Transparent rule-based prototype — recommendations support, but do not replace, human property-management judgement.

Simulated state can be useful for reproducible demonstration, but a person must verify real room conditions, resident needs, device safety, property policy, and appropriate action before making any operational or rental-marketing decision.
