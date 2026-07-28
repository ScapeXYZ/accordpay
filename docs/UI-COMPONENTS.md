# AccordPay UI Components

## Purpose

This document describes the reusable product-interface foundation in `apps/web/src/components`. The components use the approved AccordPay tokens and A3 assets. They do not connect wallets, query GIWA, submit transactions, authenticate users, or implement escrow business logic.

The private `/ui-review` route uses clearly labelled demonstration data to display important variants and states. It is not linked from public navigation.

## Component inventory

### UI components

| Component          | Location                                | Status                              |
| ------------------ | --------------------------------------- | ----------------------------------- |
| Button             | `components/ui/button.tsx`              | Ready                               |
| Input              | `components/ui/input.tsx`               | Ready                               |
| Textarea           | `components/ui/textarea.tsx`            | Ready                               |
| Select             | `components/ui/select.tsx`              | Ready                               |
| Card               | `components/ui/card.tsx`                | Ready                               |
| Badge              | `components/ui/badge.tsx`               | Ready                               |
| Alert              | `components/ui/alert.tsx`               | Ready                               |
| Spinner            | `components/ui/spinner.tsx`             | Ready                               |
| Skeleton           | `components/ui/skeleton.tsx`            | Ready                               |
| ConfirmationDialog | `components/ui/confirmation-dialog.tsx` | Ready with native-dialog limitation |

### Shared product components

| Component         | Location                                   | Status                            |
| ----------------- | ------------------------------------------ | --------------------------------- |
| BrandLockup       | `components/shared/brand-lockup.tsx`       | Ready                             |
| EmptyState        | `components/shared/empty-state.tsx`        | Ready                             |
| WatermarkSurface  | `components/shared/watermark-surface.tsx`  | Ready with placement restrictions |
| NetworkIndicator  | `components/shared/network-indicator.tsx`  | Presentational only               |
| WalletPlaceholder | `components/shared/wallet-placeholder.tsx` | Presentational only               |

### Layout components

| Component      | Location                            | Status |
| -------------- | ----------------------------------- | ------ |
| PageHeader     | `components/layout/page-header.tsx` | Ready  |
| Container      | `components/layout/primitives.tsx`  | Ready  |
| Stack          | `components/layout/primitives.tsx`  | Ready  |
| Inline         | `components/layout/primitives.tsx`  | Ready  |
| Grid           | `components/layout/primitives.tsx`  | Ready  |
| Divider        | `components/layout/primitives.tsx`  | Ready  |
| VisuallyHidden | `components/layout/primitives.tsx`  | Ready  |

## Public API summary

### Button

- `variant`: `primary`, `secondary`, `ghost`, or `destructive`
- `loading`: disables activation and replaces visible content with `loadingText`
- `loadingText`: accessible visible loading label
- `href`: renders an anchor; omitted renders a button
- Standard button or anchor attributes are forwarded.

Links remove navigation and keyboard focus while disabled or loading. Links opened in a new tab receive `noopener noreferrer` unless an explicit relation is provided.

### Input

- Required `label`
- `helperText` or `error`
- `prefix` and `suffix`
- Native input types including text, number, search, and datetime-local
- Native `required`, `disabled`, and `readOnly`

The component generates an ID when one is not supplied and creates the correct `aria-describedby` and `aria-invalid` relationships.

### Textarea

- Required `label`
- `helperText`, `error`, and native disabled state
- `showCharacterCount`
- Native `maxLength`

The initial character count reflects controlled `value` or initial `defaultValue`. Live character-count updates require controlled state in the consuming form.

### Select

- Required `label`
- Native options array
- Optional disabled placeholder
- `helperText`, `error`, required, and disabled support

The component deliberately uses a native `<select>` rather than a custom listbox.

### Card

- `variant`: `standard`, `interactive`, `elevated`, or `tinted`
- `padding`: applies or removes standard internal spacing
- Standard div attributes are forwarded.

Interactive styling does not make a card interactive by itself. A real link or button must provide semantics and keyboard behavior.

### Badge

- `status`: `created`, `funded`, `delivered`, `completed`, `refunded`, `disputed`, `cancelled`, `pending`, or `testnet`
- Optional custom visible label

Every badge includes visible text and a shape marker, so colour is not the only state signal.

### Alert

- `variant`: `info`, `success`, `warning`, or `error`
- Required `title` and `description`
- Optional action

Errors use `role="alert"`; other variants use `role="status"`. Avoid repeatedly mounting informational alerts because live-region announcements can become noisy.

### Spinner and Skeleton

- Spinner sizes: `small`, `medium`, `large`
- Spinner requires a meaningful loading label.
- Skeleton variants: `text`, `card`, `table-row`
- Skeleton accepts an accessible label.

Both stop animation under `prefers-reduced-motion`.

### ConfirmationDialog

- Trigger label
- Title and description
- Confirm and cancel labels
- Optional destructive treatment
- Optional confirmation callback

It uses the native modal `<dialog>` API. `showModal()` makes the surrounding document inert, moves focus into the dialog, supports Escape dismissal, and constrains keyboard focus in supported browsers. The component restores focus to its trigger on close.

### BrandLockup

- `surface`: `light` or `dark`
- `variant`: `compact` or `full`
- Optional tagline

It uses the approved A3 asset and live text “AccordPay.” It does not embed text inside SVG artwork.

### EmptyState

- Required title and description
- Optional primary and secondary actions
- Includes an approved decorative A3 watermark

### WatermarkSurface

- `position`: `top-right`, `bottom-right`, or `centered`
- `opacity`: clamped to `0.02–0.05`
- Children remain in a separate foreground layer.

### NetworkIndicator

Displays GIWA Sepolia, chain ID 91342, and Testnet. It does not inspect a wallet or claim a network connection.

### WalletPlaceholder

Displays **Wallet disconnected** and a **Connect wallet** button. It contains no address, balance, provider, or connection claim.

### PageHeader

- Eyebrow, title, and description
- Breadcrumbs
- Primary and secondary actions
- Optional GIWA Sepolia testnet badge

### Layout primitives

- `Container`: reading, content, and wide widths
- `Stack`: vertical rhythm
- `Inline`: wrapping horizontal relationships
- `Grid`: one, two, three, four, six, or twelve columns
- `Divider`: neutral visual separation
- `VisuallyHidden`: assistive-technology-only content

## Accessibility notes

- Form labels use explicit `for` and ID associations.
- Helper and error messages use `aria-describedby`.
- Invalid fields set `aria-invalid`.
- Error text appears directly after the relevant control.
- Required markers are decorative; the native required attribute conveys the requirement.
- Buttons and links have visible focus states.
- Loading buttons prevent repeated activation and expose visible loading text.
- Badges never rely on colour alone.
- Motion respects reduced-motion preferences.
- Brand and watermark images use empty alternative text when decorative.
- Breadcrumbs use a labelled navigation landmark and `aria-current`.
- Native select and dialog behaviors are preferred over custom interaction models.

## Correct usage

- Use one primary button per decision region.
- Name consequential actions by outcome: **Release funds**, not **Continue**.
- Use helper text before errors occur and specific corrective errors afterward.
- Use interactive cards only when they contain a semantic link or button.
- Use exact status labels that match authoritative contract state.
- Use alerts for meaningful changes, not permanent decoration.
- Give loading states process-specific labels.
- Use empty states only when content is genuinely absent.
- Keep wallet and network components presentational until integration is implemented.

## Incorrect usage

- Do not nest links inside buttons or buttons inside links.
- Do not disable navigation without explaining why when the user needs recovery.
- Do not use placeholder text as the only form label.
- Do not use an error alert for normal pending states.
- Do not make an entire card clickable without keyboard and focus semantics.
- Do not claim a transaction is confirmed from a loading state.
- Do not place mock addresses, balances, or transaction hashes in shared product components.
- Do not describe wallet connection as login or authentication.
- Do not use the testnet badge as evidence of wallet network state.

## Watermark rules

- Use only `/brand/logo-icon-light.svg` or another explicitly approved A3 asset.
- Keep opacity between 2% and 5%.
- Mark the image decorative with empty alternative text and `aria-hidden`.
- Disable pointer interaction.
- Keep semantic content in a separate foreground layer.
- Use only on quiet, spacious surfaces.
- Do not use behind dense tables, forms, transaction amounts, alerts, dialogs, or other high-attention financial content.
- Never place a watermark inside a form field.
- A centred watermark needs additional review because it is most likely to compete with content.

## Readiness and limitations

### Ready

Button, form controls, cards, badges, alerts, loading primitives, empty states, brand lockups, page headers, watermark surfaces, and layout primitives are ready for product composition and application-level testing.

### Presentational only

- `NetworkIndicator` displays approved static GIWA Sepolia information but does not detect chain state.
- `WalletPlaceholder` exposes a callback but does not connect a wallet.
- Demonstration agreement values on `/ui-review` are explicitly non-live.

### Confirmation dialog limitation

The dialog depends on the native HTML `<dialog>` and `showModal()` implementations. Modern browsers provide modal background inertness, Escape handling, and focus containment. Before production release, AccordPay must test the exact supported browser matrix, screen readers, mobile virtual keyboards, nested scroll behavior, and transaction-confirmation content. If a supported browser fails those tests, adopt a specialized, audited dialog primitive rather than adding ad hoc focus-trap logic.
