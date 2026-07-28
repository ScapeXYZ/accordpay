# AccordPay Application Shell

## Route inventory

- `/app` — demonstration dashboard
- `/app/agreements` — searchable agreement collection preview
- `/app/create` — disabled multi-step escrow form preview
- `/app/transactions` — demonstration transaction-event table
- `/app/activity` — demonstration lifecycle timeline
- `/app/settings` — wallet, network, and preference preview
- `/app-shell-review` — private shell-state review

## Navigation hierarchy

Desktop navigation uses a persistent left sidebar: Dashboard, Agreements, Create Escrow, Transactions, Activity, and Settings. Tablet uses a compact header with an inline disclosure containing all routes. Mobile uses the same top header, a disclosure for secondary routes, and labelled bottom navigation for Dashboard, Agreements, Create, and Activity.

## Responsive behaviour

- Desktop at 1024px and above: persistent sidebar and sticky header.
- Tablet below 1024px: sidebar is removed; the header menu exposes all routes.
- Mobile below 768px: compact header and four-item bottom navigation.
- The layout supports 320px without intentional horizontal overflow.

The tablet/mobile menu is an inline disclosure, not a modal drawer. It does not require or simulate a focus trap.

## Sidebar collapse behaviour

Collapse state is local React state and is not persisted. The control remains a keyboard-accessible button with an expanded state. Collapsed links retain accessible names and visible initial glyphs; browser tooltips expose full labels on pointer hover.

## Demonstration-data policy

Every count, agreement, status, amount, deadline, and event is labelled as demonstration content. Nothing is presented as fetched from GIWA. No real or fake address, balance, transaction hash, explorer link, notification count, or live connection is shown.

## Placeholder limitations

- Wallet controls say **Wallet disconnected** and do not connect.
- Network context displays the approved static GIWA Sepolia configuration but does not detect the wallet chain.
- Notification controls have no count and announce that notifications are inactive.
- The avatar is generic and explicitly does not represent a user profile.

## Watermark usage

The approved A3 icon watermark appears only inside dedicated empty or quiet panels. Activity and Agreements use it only in separate empty-state examples.

### Full lockup watermark

`WatermarkSurface` supports a decorative icon-plus-live-text AccordPay lockup at approximately 2% opacity. It is reserved for large, quiet regions. The text remains live HTML and is placed inside an `aria-hidden` decorative wrapper.

### Prohibited placements

Never place either watermark behind:

- Forms or settings controls
- Wallet information
- Balances or transaction amounts
- Alerts
- Dense tables or timelines
- Transaction values or hashes
- Contract addresses
- Primary actions

## Card hover elevation

Only `interactive` cards rise on hover. Movement is limited to 1px and uses the neutral Level 2 shadow, visually approximating a restrained 4–6dp elevation. Non-interactive cards do not move. Reduced-motion removes the transform.

## Accessibility

- Semantic aside, nav, header, and main landmarks
- Skip-to-content link
- Keyboard-accessible collapse and menu controls
- Visible focus indicators
- `aria-current` on active destinations
- `aria-expanded` and `aria-controls` on the mobile menu
- Visible labels in mobile bottom navigation
- Decorative watermarks excluded from the accessibility tree
- Text accompanies all semantic colour states
- Reduced-motion support for shell and cards

## Features intentionally excluded

Wallet connection, Wagmi, Viem, RPC requests, contract reads and writes, transaction submission, explorer integration, authentication, notification delivery, user profiles, live balances, and live agreement data.

## Known limitations

The tablet/mobile disclosure is not a modal drawer and therefore does not close on outside click or Escape. This is intentional: all content remains in normal document flow and keyboard accessible. A future modal drawer should use an audited accessible dialog primitive rather than custom focus-trap logic.

Navigation uses simple letter glyphs until an approved icon library or original icon set is selected.

## What becomes live later

After Wagmi, Viem, and contract integration, the shell may receive verified wallet state, chain detection, supported network switching, contract-derived agreement data, transaction receipts, explorer links, and real activity. Every placeholder must then be replaced by authoritative state without changing the disclosure rules for testnet and Test ETH.
