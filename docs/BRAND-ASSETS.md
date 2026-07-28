# AccordPay Brand Assets

This document defines the visual direction for future AccordPay assets and interface patterns. It does not authorize placeholder artwork, unverified claims, or production asset creation without review.

## Primary colours

| Name     | HEX       | Use                                      |
| -------- | --------- | ---------------------------------------- |
| Pine 950 | `#092E25` | Deep emphasis and dark branded surfaces  |
| Pine 800 | `#0F493A` | Strong branded text and active controls  |
| Pine 700 | `#14614D` | Primary-action hover state               |
| Pine 600 | `#18745C` | Primary actions and active brand accents |
| Pine 100 | `#DDEFE8` | Selected and highlighted backgrounds     |
| Pine 50  | `#F0F8F5` | Quiet branded surfaces                   |

Pine is the identifying colour family. Use it deliberately rather than flooding every surface with green.

## Secondary colours

| Name            | HEX       | Use                      |
| --------------- | --------- | ------------------------ |
| Ink 950         | `#101815` | Primary text             |
| Ink 700         | `#34433E` | Secondary headings       |
| Ink 600         | `#52615C` | Supporting text          |
| Ink 500         | `#6C7975` | Metadata                 |
| Ink 300         | `#A9B3AF` | Disabled foreground      |
| Ink 200         | `#CDD5D2` | Strong borders           |
| Ink 100         | `#E5EAE8` | Default borders          |
| Ink 50          | `#F4F6F5` | Application background   |
| White           | `#FFFFFF` | Primary surface          |
| Information 700 | `#175A9C` | Informational foreground |
| Information 50  | `#EDF6FF` | Informational background |

Neutrals should dominate product layouts. Information blue is semantic, not a competing brand colour.

## Success

- Foreground: Green 700, `#197044`
- Background: Green 50, `#ECF8F1`

Success identifies confirmed completion, such as a settled agreement. Pair colour with explicit text and an icon. Do not show success before the relevant network or system confirmation.

## Warning

- Foreground: Amber 700, `#8A5600`
- Background: Amber 50, `#FFF7E6`

Warnings identify attention, deadlines, waiting states, or consequential conditions. They must explain the condition and next action. Amber does not automatically mean failure.

## Error

- Foreground: Red 700, `#A33434`
- Background: Red 50, `#FFF0F0`

Errors identify failed, invalid, or destructive states. Always provide plain-language context and recovery guidance. Never claim funds are lost unless that outcome is confirmed.

## Typography

Use Inter as the preferred interface family with Arial, Helvetica, and sans-serif fallbacks. Use a reviewed monospace family only for hashes, addresses, and code-like identifiers. Financial values use tabular numerals.

Typography should be compact, legible, and restrained:

- Display: 48px / 56px, weight 650
- Heading 1: 36px / 44px, weight 650
- Heading 2: 28px / 36px, weight 650
- Heading 3: 22px / 30px, weight 600
- Body large: 18px / 28px, weight 400
- Body: 16px / 24px, weight 400
- Body small: 14px / 20px, weight 400
- Label: 14px / 20px, weight 600
- Caption: 12px / 16px, weight 500

Do not use decorative typefaces for operational content or compress important financial text.

## Illustration direction

Illustration should explain relationships, protected steps, and settlement states through abstract structure, measured geometry, and controlled negative space. Use Pine, Ink, and limited semantic accents on quiet backgrounds. Compositions should feel authored and specific to agreements rather than drawn from generic fintech or Web3 libraries.

Avoid coins, floating tokens, chain links, robots, shields, glowing networks, and decorative 3D objects.

## Photography direction

Photography should portray credible people and working environments with natural light, composed framing, and genuine context. Prefer moments of review, collaboration, delivery, and independent commerce over staged handshakes or celebratory payment scenes.

Use photography only when it adds human relevance. Avoid artificial corporate stock poses, visible third-party financial brands, token imagery, exaggerated wealth cues, and imagery that implies guarantees or partnerships.

## Icon style

Use one outlined icon family with rounded joins, restrained terminals, and a consistent 1.75–2px stroke. Standard optical sizes are 16px, 20px, and 24px. Icons must remain identifiable without colour and should accompany labels for consequential actions.

Do not mix icon families or use icons as unsupported security claims.

## UI illustration style

UI illustrations are compact and functional. They may support onboarding, empty states, or explanations using simple planes, precise paths, and limited depth. They should preserve generous negative space and remain subordinate to the interface message.

Use no more than one focal concept per illustration. Avoid character mascots, dense scenes, gradients used for spectacle, and continuous ambient animation.

## Marketing illustration style

Marketing artwork may use broader compositions but must retain the same geometric discipline. Visual narratives can represent two parties, protected value, defined terms, and completed settlement through abstract relationships.

Every illustration must communicate a specific product idea. Do not depict unbuilt features, fake partners, fake transaction activity, or unsupported security certification.

## Empty states

An empty state contains:

1. A concise description of what is absent.
2. A short explanation when the reason is useful.
3. One relevant primary action at most.
4. Optional restrained artwork that does not overpower the message.

Differentiate a new account, filtered-out results, unavailable data, and an error. Do not use celebratory artwork for an empty operational dashboard.

## Charts

Charts must answer a real operational question using verified data. Use Ink for structure, Pine for the primary series, and semantic colours only for their defined meanings. Provide labels, units, time ranges, accessible summaries, and tooltips that can be reached without precise pointer movement.

Avoid 3D charts, decorative area gradients, truncated axes that distort meaning, excessive series, and charts used only to fill space. Do not introduce charts before the product has real, useful metrics.

## Animations

Use animation to confirm input, show state change, preserve context, or explain sequence. Standard durations are 120ms, 180ms, and 240ms. Prefer opacity and transform, respect reduced-motion settings, and stop movement when its purpose is complete.

Avoid bounce, confetti, parallax, glowing pulses, looping decorative movement, and animations that delay financial actions.

## Button appearance

- Primary: Pine 600 background, white text, Medium radius.
- Secondary: White background, Ink 200 border, Ink 950 text.
- Tertiary: Transparent background, Pine 700 text.
- Destructive: Red 700 background, white text.

Use 40px standard height, 36px compact height, and 48px large height. Provide visible hover, active, focus, disabled, and loading states. Use specific action labels such as “Fund agreement” and “Release payment.”

## Card appearance

Use a white surface, Ink 100 border, Large radius, and 24px default padding. Prefer borders to shadows; Level 1 elevation is reserved for separation from similar backgrounds. A card should contain one coherent subject and a stable header, body, and optional footer hierarchy.

Agreement cards prioritize state, amount, counterparties, deadline, and next action. Avoid excessive nesting.

## Form appearance

Fields use white backgrounds, Ink 200 borders, Medium radius, and a minimum 44px height. Labels remain visible above fields. Supporting and error text appears close to the relevant control. Focus uses a separated 2px Pine ring.

Group fields by user intent rather than data schema. Clearly label amounts, assets, wallet addresses, deadlines, and irreversible consequences. Preserve valid input after errors.

## Tables

Tables use strong column alignment, concise headers, subtle row dividers, tabular numerals, and stable action placement. Align numbers to the end and text to the start. Keep the most important identity or agreement column visible.

Use restrained row hover and selection states. Do not rely on horizontal scrolling as the only mobile strategy; transform rows into structured records when necessary. Empty, loading, error, and filtered states must be distinct.

## Badges

Badges identify compact categories, network attribution, or limited metadata. They use Small or Full radius, compact padding, and short sentence-case labels. Neutral badges are the default. Brand colour may indicate a selected or AccordPay-owned category.

Badges must not imitate certification seals or imply approval, verification, or partnership without evidence.

## Status chips

Status chips communicate agreement or transaction state using text, icon, and colour together. Use a pale semantic background and high-contrast foreground:

- Draft and neutral: Ink
- Active or informational: Blue
- Waiting or attention: Amber
- Completed: Green
- Failed or action required: Red

Use precise labels such as “Awaiting funding,” “Delivery submitted,” and “Payment released.” Avoid ambiguous labels such as “Processing” when a more exact state is known.
