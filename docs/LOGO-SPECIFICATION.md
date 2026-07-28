# AccordPay Logo Specification

## Approval record

**A3 — Controlled Release** was approved by the AccordPay product lead on **July 28, 2026** as the official AccordPay logo mark.

The approved geometry uses two independent, balanced paths. Together they create a protected central holding space and a controlled lower release path, resolving into a stable settlement silhouette. The mark communicates agreement and escrow without using a padlock, shield, coin, handshake, trading arrow, or literal security symbol.

Approved production assets live directly in `apps/web/public/brand/`. Files under `concepts/` and `refinements/` are preserved design history and are not production identity assets.

No vector wordmark has been approved or created. The product name **AccordPay** will later appear as accessible live text beside the mark in website and application interfaces.

## 1. Brand story

AccordPay exists because commerce between independent parties often begins with uncertainty. Buyers need confidence that funds will not be released before agreed conditions are met. Sellers need confidence that committed payment exists before they deliver. Traditional escrow can add friction, delay, and opacity, while direct digital payments can force one party to accept disproportionate risk.

AccordPay turns an agreement into a clear settlement process. It provides verified escrow and programmable commerce infrastructure on GIWA Chain so both parties can understand the terms, the location of funds, the current state, and the action required to complete a transaction.

The identity should represent protected cooperation rather than defensive security. AccordPay is not a speculative crypto brand. It is calm financial infrastructure for reaching and completing an accord.

## 2. Brand attributes

- **Professional:** disciplined enough for consequential financial workflows.
- **Secure:** careful, structured, and explicit without making unsupported guarantees.
- **Calm:** composed during funding, waiting, settlement, and failure states.
- **Transparent:** clear about terms, status, responsibility, and transaction outcomes.
- **Trustworthy:** consistent in language, behaviour, and visual presentation.
- **Modern:** digitally native without depending on short-lived visual trends.
- **Premium:** refined through proportion, craft, restraint, and detail.
- **Enterprise-ready:** credible across merchant, platform, and business contexts.

## 3. Logo objectives

The logo must communicate the ideas of agreement, escrow, trust, settlement, two parties, a secure transaction, and financial professionalism without depicting any of them literally.

It should:

- Suggest two independent sides entering a balanced relationship.
- Include a protected centre, junction, or passage that can represent escrow.
- Convey movement toward a resolved state rather than indefinite circulation.
- Remain stable and recognizable at interface-icon sizes.
- Feel credible beside established financial and infrastructure brands.
- Work without gradients, texture, animation, or explanatory text.
- Remain distinct from GIWA while pairing respectfully with network attribution.

## 4. Concepts to explore

### Concept A — The Accord Mark

A geometric “A” formed from two interlocking paths with protected negative space.

The paths represent independent parties. Their alignment creates the letterform and a shared central space without merging either party into the other. The negative space may suggest held value or agreed terms. The construction should avoid resembling a chain link, arrow, mountain, or stylized cryptocurrency token.

### Concept B — The Bridge

Two shapes connected by a central protected junction.

The outer forms remain visually balanced while the junction represents the controlled path between commitment and settlement. The concept should feel structural and precise rather than architectural or illustrative. The bridge must be inferred through proportion and connection, not drawn as a literal bridge.

### Concept C — The Settlement Loop

A continuous path representing agreement and successful settlement.

The path should communicate a complete, governed process with a clear point of resolution. Subtle duality within the loop can represent buyer and seller. It must not resemble a loading spinner, infinity symbol, chain link, refresh icon, or circular exchange arrows.

## 5. Elements to avoid

Do not use:

- Padlocks
- Shields
- Coins
- Dollar signs
- Handshakes
- Blockchain cubes
- Ethereum logos
- AI robot imagery
- Generic crypto gradients

Also avoid gavels, keys, vaults, checkmarks as the primary concept, literal letters placed inside coins, and visual claims of institutional certification.

## 6. Logo variants required

The approved icon system includes:

- **Primary icon:** `logo-icon.svg` for white and light surfaces.
- **Dark-surface icon:** `logo-icon-dark.svg` for Pine 800 and approved dark surfaces.
- **Single-colour pine icon:** `logo-icon-light.svg` for light surfaces.
- **Monochrome icon:** `logo-monochrome.svg` for printing and neutral documents.
- **Monochrome inverse:** `logo-monochrome-light.svg` for dark backgrounds.
- **Favicon:** `favicon.svg` for browser metadata and compact use.

Every variant must originate from the same geometry. Variants must not introduce alternate symbols, decorative containers, or unapproved colours.

Horizontal and vertical wordmark lockups remain future deliverables. Do not assemble an unofficial lockup from the icon and an outlined or embedded font.

## 7. Minimum sizing

Final artwork must be optically tested before these provisional minimums are approved:

| Variant           | Digital minimum               | Print minimum  |
| ----------------- | ----------------------------- | -------------- |
| Horizontal lockup | 120px wide                    | 32mm wide      |
| Vertical lockup   | 72px wide                     | 20mm wide      |
| Icon only         | 24px square                   | 8mm square     |
| App icon          | Platform-required export size | Not applicable |
| Favicon           | 16px square                   | Not applicable |

At or below 24px, use only the icon. Do not use the wordmark when letterforms become indistinct. The favicon may require a formally approved simplified construction rather than automatic scaling.

## 8. Safe area rules

Define `x` as the width of the protected central negative space in the final icon.

- Keep at least `1x` clear space around the icon-only mark.
- Keep at least `1x` above and below a lockup.
- Keep at least `1.5x` to the left and right of a lockup.
- App icons must also observe each platform’s safe-area template.
- No text, border, partner mark, illustration, or interface control may enter the safe area.
- A background colour or photograph may extend through the safe area only when contrast and visual quiet are preserved.

When AccordPay and GIWA marks appear together, treat them as independent identities. Use a neutral separator and spacing greater than the AccordPay lockup’s normal internal spacing. Do not create a merged or shared logo.

## 9. Incorrect usage

Do not:

- Stretch, compress, rotate, skew, crop, or redraw the artwork.
- Change the relationship between the mark and wordmark.
- Replace the approved wordmark typography.
- Apply gradients, glows, bevels, outlines, textures, or drop shadows.
- Place the logo on a low-contrast or visually busy background.
- Recolour individual paths to imply unapproved status or network meaning.
- Recolour the approved assets arbitrarily or use a light-surface asset on a dark surface.
- Put the logo inside a coin, shield, badge, or arbitrary container.
- Animate separate pieces in a way that suggests instability or conflict.
- Add “GIWA,” “Chain,” “Escrow,” or another descriptor to the lockup.
- Present AccordPay as owned by GIWA or combine both brands into one mark.
- Use preliminary concepts as production artwork.

## 10. Future SVG requirements

Future SVG files must:

- Use clean, minimal paths with no embedded raster images.
- Include a precise `viewBox` and omit fixed dimensions where responsive use is expected.
- Remove editor metadata, comments, hidden layers, and unnecessary groups.
- Use approved solid colour values or documented `currentColor` behaviour.
- Avoid embedded fonts; convert an approved custom wordmark to optimized outlines.
- Preserve accessible naming support through an implementation-defined title strategy.
- Avoid inline scripts, event handlers, external references, masks, and filters unless formally reviewed.
- Minimize decimal precision without changing the approved geometry.
- Pass SVG validation, optimization, security review, and rendering tests.
- Be tested on light and dark surfaces and at every specified minimum size.
- Include source provenance, version, approval status, and export instructions outside the SVG file.

No SVG is considered approved until geometry, optical balance, small-size rendering, accessibility, trademark clearance, and brand review are complete.
