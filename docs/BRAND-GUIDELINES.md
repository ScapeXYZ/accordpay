# AccordPay Brand Guidelines

## 1. Brand personality

AccordPay is assured, precise, calm, and fair. It should feel like dependable financial infrastructure made understandable by thoughtful people. The brand is contemporary without chasing trends, technical without being cryptic, and confident without sounding absolute.

The product should communicate:

- **Security through clarity:** explain terms, states, and consequences instead of relying on security theatre.
- **Mutual confidence:** represent buyers and sellers with equal care.
- **Measured progress:** guide users through deliberate steps without artificial urgency.
- **Practical innovation:** foreground useful agreements rather than blockchain novelty.
- **Independent credibility:** maintain a distinct AccordPay identity while identifying GIWA accurately as the supported network.

## 2. Tone of voice

Use direct, composed, specific language. Prefer short sentences and familiar words. State what happened, what it means, and what the user can do next.

- Use “Fund agreement” instead of “Execute transaction.”
- Use “Waiting for the seller to mark delivery” instead of “Pending.”
- State amounts, parties, network, timing, and reversibility before consequential actions.
- Use neutral language in disputes and failures. Never imply fault without evidence.
- Avoid hype, slang, fear, exaggerated certainty, and unexplained protocol terminology.
- Use sentence case for headings, buttons, labels, and status text.
- Refer to GIWA as the network on which AccordPay is built, never as AccordPay’s owner.

## 3. Colour palette

### Brand colours

| Token    | HEX       | Role                                                |
| -------- | --------- | --------------------------------------------------- |
| Pine 950 | `#092E25` | Deep brand emphasis and high-contrast dark surfaces |
| Pine 800 | `#0F493A` | Strong brand text and pressed controls              |
| Pine 700 | `#14614D` | Primary action hover state                          |
| Pine 600 | `#18745C` | Primary action and active brand state               |
| Pine 100 | `#DDEFE8` | Selected and highlighted backgrounds                |
| Pine 50  | `#F0F8F5` | Quiet brand-tinted surface                          |

### Neutral colours

| Token   | HEX       | Role                                          |
| ------- | --------- | --------------------------------------------- |
| Ink 950 | `#101815` | Primary text                                  |
| Ink 700 | `#34433E` | Secondary headings and strong supporting text |
| Ink 600 | `#52615C` | Body-muted text                               |
| Ink 500 | `#6C7975` | Metadata and placeholder text                 |
| Ink 300 | `#A9B3AF` | Disabled foreground                           |
| Ink 200 | `#CDD5D2` | Strong borders                                |
| Ink 100 | `#E5EAE8` | Default borders and dividers                  |
| Ink 50  | `#F4F6F5` | Application background                        |
| White   | `#FFFFFF` | Primary surface and inverse foreground        |

### Semantic colours

| Token     | HEX       | Role                             |
| --------- | --------- | -------------------------------- |
| Blue 700  | `#175A9C` | Informational foreground         |
| Blue 50   | `#EDF6FF` | Informational background         |
| Amber 700 | `#8A5600` | Warning and pending foreground   |
| Amber 50  | `#FFF7E6` | Warning and pending background   |
| Red 700   | `#A33434` | Error and destructive foreground |
| Red 50    | `#FFF0F0` | Error background                 |
| Green 700 | `#197044` | Success foreground               |
| Green 50  | `#ECF8F1` | Success background               |

Pine is the AccordPay signature colour. It combines the stability of a deep green with enough restraint for financial interfaces. Neutrals carry most of the interface so status colours remain meaningful. Semantic colours must always appear with text or icon support and must not be used as decoration.

## 4. Typography

Use **Inter** as the preferred interface typeface, with `Arial`, `Helvetica`, and `sans-serif` as resilient fallbacks. The implementation may self-host an approved Inter release later; the token system must not depend on a remote font request.

Use a compact, legible type scale:

| Style      | Size / line height | Weight | Use                           |
| ---------- | ------------------ | ------ | ----------------------------- |
| Display    | 48px / 56px        | 650    | Rare product-level statements |
| Heading 1  | 36px / 44px        | 650    | Primary page title            |
| Heading 2  | 28px / 36px        | 650    | Major section title           |
| Heading 3  | 22px / 30px        | 600    | Card or subsection title      |
| Body large | 18px / 28px        | 400    | Introductory copy             |
| Body       | 16px / 24px        | 400    | Default interface copy        |
| Body small | 14px / 20px        | 400    | Supporting information        |
| Label      | 14px / 20px        | 600    | Controls and field labels     |
| Caption    | 12px / 16px        | 500    | Metadata and compact statuses |

Use tabular numerals for amounts, balances, dates, and transaction identifiers. Do not use display typography for operational data. Limit regular prose to approximately 70 characters per line.

## 5. Spacing scale

The scale uses a 4px base unit with deliberate intermediate steps:

| Token | Value | Purpose                                        |
| ----- | ----- | ---------------------------------------------- |
| 0     | 0     | Remove spacing explicitly                      |
| 1     | 4px   | Icon corrections and tight internal separation |
| 2     | 8px   | Closely related inline items                   |
| 3     | 12px  | Compact control and status spacing             |
| 4     | 16px  | Default component padding and content gaps     |
| 5     | 20px  | Comfortable control groups                     |
| 6     | 24px  | Card padding and subsection separation         |
| 8     | 32px  | Related section separation                     |
| 10    | 40px  | Dense page-region separation                   |
| 12    | 48px  | Standard page-section separation               |
| 16    | 64px  | Large layout rhythm                            |
| 20    | 80px  | Major desktop section separation               |
| 24    | 96px  | Reserved editorial whitespace                  |

Prefer spacing relationships over arbitrary coordinates. Adjacent elements should be closer when they are more closely related.

## 6. Border radius scale

| Token       | Value | Purpose                                       |
| ----------- | ----- | --------------------------------------------- |
| None        | 0     | Tables, dividers, and edge-aligned structures |
| Small       | 6px   | Tags, compact controls, and nested surfaces   |
| Medium      | 10px  | Inputs and standard buttons                   |
| Large       | 14px  | Cards and prominent controls                  |
| Extra large | 20px  | Major panels and empty states                 |
| Full        | 999px | Pills, status dots, and circular controls     |

Rounded corners should soften interactions without making a financial interface playful. Nested elements should normally use a smaller radius than their containing surface.

## 7. Elevation system

Elevation is sparse and functional:

| Level | Use                                                |
| ----- | -------------------------------------------------- |
| 0     | Default surfaces separated by border or background |
| 1     | Raised cards and sticky controls                   |
| 2     | Menus, popovers, and floating action regions       |
| 3     | Dialogs and critical overlays                      |

Use borders before shadows. Never stack multiple strong shadows, use coloured glow, or imply that every card floats. Higher elevation must correspond to higher interaction priority.

## 8. Grid system

Use a fluid 12-column desktop grid, an 8-column tablet grid, and a 4-column mobile grid.

- Maximum content width: 1200px
- Maximum wide workspace width: 1440px
- Desktop gutters: 32px
- Tablet gutters: 24px
- Mobile gutters: 16px
- Column gaps: 24px desktop, 20px tablet, and 16px mobile

Operational dashboards may use the wide workspace container. Reading and form flows should use narrower measures. Align headings, filters, content, and primary actions to shared grid lines.

## 9. Iconography principles

Use one coherent, outlined icon family with a 1.75–2px stroke and rounded joins. Default sizes are 16px, 20px, and 24px. Icons clarify actions or states; they do not replace essential labels. Avoid cryptocurrency coins, chain-link clichés, shields used as unsupported security claims, and mixing filled and outlined families. Directional and status icons must remain recognizable without colour.

## 10. Motion principles

Motion confirms cause and effect, preserves spatial context, and draws attention to meaningful change. Use 120ms for immediate feedback, 180ms for standard state changes, and 240ms for panels or overlays. Use a composed ease-out curve for entrances and a standard ease for reversible state changes.

Animate opacity and transform where practical. Avoid bounce, dramatic parallax, ambient movement, and decorative loading loops. Respect `prefers-reduced-motion` by removing non-essential movement and reducing required transitions to near-instant feedback.

## 11. Button styles

Buttons use a 40px default height, 36px compact height, and 48px large height. Each must have a visible label, at least a 44px touch target where possible, and distinct default, hover, active, focus, disabled, and loading states.

- **Primary:** Pine 600 background with white text; one primary action per decision region.
- **Secondary:** White surface, Ink 200 border, and Ink 950 text.
- **Tertiary:** Transparent background with Pine 700 text for low-emphasis actions.
- **Destructive:** Red 700 background with white text; use only when consequences are destructive.

Loading buttons retain their width and label context. Disabled controls must not rely only on reduced opacity. Consequential labels should name the result, such as “Release payment,” not “Continue.”

## 12. Input styles

Inputs use a minimum 44px height, Medium radius, white background, Ink 200 border, and Ink 950 text. Labels sit above fields and remain visible after entry. Supporting text explains format or consequences before an error occurs.

Focus uses a 2px Pine 600 ring with separation from the border. Errors use Red 700 text and border plus a specific corrective message. Read-only and disabled states must be visually distinct. Amount inputs use tabular numerals and clearly identify asset and network. Never use placeholder text as the only label.

## 13. Card styles

Cards group one coherent subject or decision. Standard cards use a white surface, Ink 100 border, Large radius, and 24px padding. Use Level 1 elevation only when a card must separate from a similar background. Maintain a consistent header, content, and optional footer structure.

Avoid wrapping every element in a card. Do not nest more than one bordered card level unless the hierarchy requires it. Agreement cards prioritize status, counterparties, amount, deadline, and next action.

## 14. Dashboard design principles

Dashboards are operational workspaces, not promotional pages. Lead with current obligations, agreement states, and next actions. Keep aggregate figures secondary until backed by real data. Provide explicit filters, meaningful defaults, scannable status language, and stable table columns.

Do not use decorative charts, vanity metrics, or unsupported statistics. Preserve context when users navigate into an agreement and return. On mobile, transform tables into structured records without removing essential fields or actions.

## 15. Accessibility rules

- Meet WCAG 2.2 AA as the baseline.
- Maintain at least 4.5:1 contrast for normal text and 3:1 for large text and meaningful interface graphics.
- Provide complete keyboard operation with logical focus order and visible focus indicators.
- Use semantic HTML before ARIA and announce asynchronous status changes appropriately.
- Keep touch targets at least 44×44px where practical.
- Do not convey status, validation, or selection through colour alone.
- Support text resizing to 200% without loss of content or operation.
- Respect reduced-motion and high-contrast preferences.
- Write descriptive control names, link text, errors, and page titles.
- Move focus intentionally after dialogs, route changes, and validation failures.

## 16. Responsive breakpoints

Design mobile-first. Breakpoints mark layout pressure, not specific devices:

| Token       | Minimum width | Intended change                                        |
| ----------- | ------------- | ------------------------------------------------------ |
| Small       | 480px         | Expanded mobile spacing and compact two-column options |
| Medium      | 768px         | Tablet navigation and multi-column forms               |
| Large       | 1024px        | Desktop navigation and dashboard grid                  |
| Extra large | 1280px        | Wider operational layouts                              |
| 2XL         | 1536px        | Controlled use of wide workspace container             |

Content must remain usable below 480px down to the 320px minimum. Avoid hiding core actions at any breakpoint.

## 17. Empty state design

Explain what the area will contain, why it is empty, and the most relevant next step. Use a concise heading, one short supporting paragraph, and at most one primary action. Illustrations are optional and must be restrained, product-specific, and accessible. Distinguish a true empty state from filtered-out results and unavailable data.

## 18. Error state design

State the failed action in plain language, preserve user input, and provide a safe recovery path. Where useful, separate wallet rejection, network failure, validation failure, and contract rejection. Do not expose raw stack traces or imply funds are lost without confirmation. Destructive or financial errors should include relevant agreement or transaction context and a support-ready reference.

## 19. Loading state design

Show loading only when work is occurring. Use stable skeletons for structured content, compact progress indicators for local actions, and explicit transaction stages for blockchain operations. Prevent layout shift, preserve button width, and avoid indefinite spinners without explanation. After a reasonable delay, explain that processing is taking longer and what the user may safely do.

## 20. Success state design

Confirm the completed action, its financial result, and the new agreement state. Provide the most useful next action without celebratory excess. For settlement, include the amount, recipient, network, and transaction reference when real data is available. Use Green 700 and Green 50 as supporting signals alongside a clear success heading or icon.
