# AccordPay Detailed Screen Wireframe Specification

## Purpose

This document defines low-fidelity structure, content hierarchy, responsive behaviour, and system feedback for AccordPay’s priority screens. Text diagrams indicate relationships rather than final dimensions or visual design. They do not authorize UI implementation, artwork, fake data, or unsupported product claims.

## 1. Global public website layout

### Structure

```text
┌──────────────────────────────────────────────────────────────┐
│ Optional verified network or product-status announcement    │
├──────────────────────────────────────────────────────────────┤
│ AccordPay logo        Landing  About  Docs       [Launch App]│
├──────────────────────────────────────────────────────────────┤
│                                                              │
│                 Main content container                       │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│ AccordPay summary | Documentation | Policies | Built on GIWA │
└──────────────────────────────────────────────────────────────┘
```

### Announcement or network-status area

Use only when there is a verified, time-relevant notice such as test-environment availability, scheduled maintenance, or material product limitation. State the exact affected environment and link to a real detail source. The area is dismissible only when the notice is non-critical. Do not use it for promotions, artificial urgency, token prices, or unverified network claims.

### Header

The desktop header places the AccordPay identity at the start, public navigation centrally or immediately after it, and **Launch App** at the end. It remains visually stable across public routes. A sticky treatment is optional; if used, it must not consume excessive reading space.

### AccordPay logo position

Place the approved horizontal AccordPay lockup at the top-left in left-to-right contexts. It links to the landing page. Until approved brand artwork exists, implementation must use a text identity rather than a provisional logo.

### Main navigation

Use the labels **Landing**, **About**, and **Documentation**. Indicate the current destination through text and more than colour. Do not include application destinations in the public navigation.

### Launch App action

**Launch App** is the sole primary header action. It opens the application shell but does not automatically connect a wallet, create an account, or imply authentication.

### Mobile menu

At mobile widths, retain the AccordPay identity and Launch App action when space permits. Put lower-priority public links in a labelled menu button with a modal or disclosure menu. The menu must trap focus only if implemented as a dialog, close with Escape, restore focus, and remain operable at 200% zoom.

### Main content container

Use the standard 1200px content container with responsive gutters. Reading sections use a narrower measure. Full-width backgrounds may extend beyond the container, but headings and content align to consistent grid lines.

### Footer

The footer contains a concise product description, public navigation, documentation, real policy links when available, product maturity language, and copyright information. Do not add inactive social icons, fake office locations, invented certifications, or unavailable legal pages.

### Built on GIWA attribution

Display **Built on GIWA** as factual network attribution in the footer and, where useful, near technical infrastructure content. AccordPay remains the primary identity. Do not merge logos, suggest ownership, or imply formal partnership terms that have not been verified.

### Desktop behaviour

- Use a single-row header when content fits.
- Keep navigation and the primary action keyboard-accessible.
- Align all major sections to a 12-column grid.
- Use 32px outer gutters and a 1200px maximum standard container.
- Allow the footer to form multiple labelled columns without becoming a link directory.

### Mobile behaviour

- Use 16px gutters down to 320px.
- Collapse public navigation into a menu.
- Stack footer groups with visible headings.
- Keep Launch App visible or make it the first menu action.
- Do not create horizontal scrolling.
- Preserve the same information order as desktop.

## 2. Landing page wireframe

### Overall order

```text
Navigation
Hero
Product trust indicators
Interactive escrow-flow preview
Problem
How AccordPay works
Buyer and seller protection
Marketplace integration
GIWA-native infrastructure
Security principles
Business model / platform value
Final CTA
Footer
```

### Navigation

- **Objective:** Orient visitors and separate education from product use.
- **Content:** AccordPay identity, Landing, About, Documentation, Launch App.
- **Visual hierarchy:** Identity first, primary action last and strongest.
- **Recommended layout:** One horizontal row in the standard container.
- **Mobile behaviour:** Identity plus menu; Launch App remains readily available.
- **Avoid:** Wallet controls, token prices, crowded links, fake status badges.

### Hero

- **Objective:** Explain AccordPay within one reading pass.
- **Content:** Product category, headline, supporting copy, primary CTA, secondary CTA, maturity statement, and restrained GIWA attribution.
- **Visual hierarchy:** Headline, supporting copy, primary CTA, secondary CTA, product-status note.
- **Recommended layout:** Text-led composition using 7–8 grid columns; an optional product-flow panel may occupy the remaining columns only when it represents real product structure.
- **Mobile behaviour:** Single column; copy precedes actions and preview.
- **Avoid:** Animated coins, robots, glowing networks, dashboards with fake data, unverified partner logos.

### Main headline

- **Objective:** State the user outcome.
- **Content:** A concise line anchored in securing agreements, not speculative technology.
- **Visual hierarchy:** Highest textual emphasis on the page.
- **Recommended layout:** Maximum two or three short lines at desktop.
- **Mobile behaviour:** Natural wrapping without forced line breaks.
- **Avoid:** “Trustless,” “risk-free,” “guaranteed,” or claims of universal protection.

### Supporting copy

- **Objective:** Explain verified escrow and programmable commerce in plain language.
- **Content:** Buyer and seller benefit, GIWA Chain context, and MVP maturity.
- **Visual hierarchy:** One short paragraph below the headline.
- **Recommended layout:** Approximately 55–70 characters per line.
- **Mobile behaviour:** Full available width with readable line height.
- **Avoid:** Protocol jargon, audit implications, unsupported integrations.

### Primary CTA

- **Objective:** Move a ready visitor into the application.
- **Content:** **Launch App**.
- **Visual hierarchy:** Sole primary action in the hero.
- **Recommended layout:** Adjacent to or above the secondary CTA.
- **Mobile behaviour:** Full-width or content-width with a 44px minimum target.
- **Avoid:** “Start earning,” “Secure funds now,” or language implying automatic wallet action.

### Secondary CTA

- **Objective:** Serve visitors who need evidence before using the product.
- **Content:** **Read documentation** or **How it works**, based on available content.
- **Visual hierarchy:** Secondary or text action.
- **Recommended layout:** Near the primary CTA.
- **Mobile behaviour:** Stacked after the primary CTA.
- **Avoid:** A visually competing second primary action.

### Product trust indicators

- **Objective:** Establish honest operational principles.
- **Content:** Examples include transparent terms, explicit transaction states, buyer-and-seller visibility, and GIWA network support.
- **Visual hierarchy:** Compact statements with optional neutral icons.
- **Recommended layout:** Three or four equal text items.
- **Mobile behaviour:** Vertical list or two-column grid when readable.
- **Avoid:** Fake statistics, “audited,” fake customer counts, security scores, or certification-style badges.

### Interactive escrow-flow preview

- **Objective:** Make the lifecycle understandable before wallet use.
- **Content:** Atomically Created and Funded, followed by Delivered and Released, plus branching Refunded or Disputed states.
- **Visual hierarchy:** Current selected step, explanation, parties, and state consequence.
- **Recommended layout:** A non-financial educational step selector with an adjacent explanation. Any displayed amounts must be clearly labelled examples.
- **Mobile behaviour:** Horizontal step control with accessible overflow or a vertical ordered sequence.
- **Avoid:** Simulated wallet prompts, fake hashes, fake live activity, automatic animation, or interaction that resembles a real transaction.

### Problem section

- **Objective:** Explain the imbalance in direct digital commerce.
- **Content:** Buyer prepayment risk, seller delivery risk, and opacity in manual processes.
- **Visual hierarchy:** Section heading followed by two balanced party perspectives.
- **Recommended layout:** Intro plus buyer and seller columns.
- **Mobile behaviour:** Buyer perspective then seller perspective.
- **Avoid:** Fear tactics, fraud statistics without sources, or portraying either party as adversarial.

### How AccordPay works

- **Objective:** Present the product mechanism.
- **Content:** Define terms, fund escrow, deliver, review, and settle.
- **Visual hierarchy:** Numbered steps with clear state outcomes.
- **Recommended layout:** Four or five sequential items.
- **Mobile behaviour:** Vertical sequence.
- **Avoid:** Hiding wallet confirmation, fees, deadlines, or alternative terminal states.

### Buyer and seller protection

- **Objective:** Explain balanced product value.
- **Content:** For buyers: conditional release and visible terms. For sellers: confirmed funding and visible settlement state.
- **Visual hierarchy:** Equal buyer and seller treatment.
- **Recommended layout:** Two matched panels with a shared principles statement.
- **Mobile behaviour:** Stacked without implying the first is more important.
- **Avoid:** Guarantees, insurance implications, or claims that all disputes can be resolved.

### Marketplace integration section

- **Objective:** Describe the future platform value without presenting an integration as live.
- **Content:** Escrow intents, user review, wallet confirmation, lifecycle status, and return flow.
- **Visual hierarchy:** “Future integration direction” label, explanation, documentation action when real.
- **Recommended layout:** Text plus a simple conceptual sequence.
- **Mobile behaviour:** Single-column sequence.
- **Avoid:** Fake marketplace logos, active API claims, fabricated integrations, or unsupported developer CTAs.

### GIWA-native infrastructure section

- **Objective:** Explain why AccordPay is built on GIWA Chain.
- **Content:** Verified network name, real supported environment, settlement role, and explorer references only when verified.
- **Visual hierarchy:** AccordPay product benefit first, network attribution second.
- **Recommended layout:** Technical explanation with a compact “Built on GIWA” label.
- **Mobile behaviour:** Text-first stack.
- **Avoid:** Copying GIWA’s identity, inventing performance statistics, or suggesting ownership.

### Security principles

- **Objective:** Explain the approach to risk without making maturity claims.
- **Content:** Minimal contract scope, explicit confirmations, state transparency, testing, wallet safety, and documented limitations.
- **Visual hierarchy:** Principles followed by the current contract status.
- **Recommended layout:** Short, scannable principle list.
- **Mobile behaviour:** Single column.
- **Avoid:** Shields as evidence, “secure by default,” audit badges without an audit, or absolute safety language.

### Business model or platform value

- **Objective:** Explain sustainable value and fee transparency.
- **Content:** A protocol or service fee on successful settlement if approved and implemented, plus future merchant or developer infrastructure possibilities.
- **Visual hierarchy:** User value before commercial model; fee disclosure before commitment.
- **Recommended layout:** Short narrative and explicit “future” labels.
- **Mobile behaviour:** Single column.
- **Avoid:** Invented pricing, revenue, transaction volume, yield, or token economics.

### Final CTA

- **Objective:** Provide a clear decision after the full explanation.
- **Content:** Launch App, documentation alternative, and MVP limitation note.
- **Visual hierarchy:** One primary action.
- **Recommended layout:** Centred or grid-aligned restrained panel.
- **Mobile behaviour:** Stacked actions.
- **Avoid:** Countdown timers, scarcity, false urgency, or duplicated claims.

### Footer

- **Objective:** Close with durable references and attribution.
- **Content:** AccordPay summary, documentation, policies when real, product status, and Built on GIWA.
- **Visual hierarchy:** Product identity followed by grouped links and attribution.
- **Recommended layout:** Three or four concise columns.
- **Mobile behaviour:** Stacked groups.
- **Avoid:** Fake social channels, customer logos, addresses, or inactive links.

## 3. Application shell

### Desktop

```text
┌───────────────┬──────────────────────────────────────────────┐
│ AccordPay     │ Breadcrumbs              GIWA | Wallet       │
│               ├──────────────────────────────────────────────┤
│ Dashboard     │ Page title                    Page action    │
│ Escrows       │ Supporting context                           │
│ Create Escrow ├──────────────────────────────────────────────┤
│ Activity      │ Notification / network notice               │
│               ├──────────────────────────────────────────────┤
│ Settings      │                                              │
│ Built on GIWA │ Main content                                 │
└───────────────┴──────────────────────────────────────────────┘
```

- **Desktop sidebar:** Persistent application navigation. Settings and GIWA attribution sit below the primary destinations.
- **AccordPay identity:** Top of the sidebar and linked to Dashboard. Use text until an approved logo exists.
- **Active state:** Uses a label, indicator, and contrast—not colour alone.
- **Wallet area:** Shows connection action or shortened connected address. Full address is available safely. Connection is not labelled as login.
- **GIWA network indicator:** Shows **GIWA Sepolia**, chain ID `91342`, and whether the connected wallet is on that network.
- **Page-title area:** Contains one page heading, concise context, and at most one primary page action.
- **Breadcrumb area:** Appears only on hierarchical screens such as Escrow Details.
- **Notification area:** Holds relevant, dismissible notices and persistent wrong-network or system warnings.
- **Main content:** Uses the standard or wide container according to task density.

### Mobile

```text
┌────────────────────────────────┐
│ AccordPay     GIWA     Wallet  │
├────────────────────────────────┤
│ Breadcrumb / back context      │
│ Page title                     │
│ Notice                         │
│                                │
│ Main content                   │
│                                │
├────────────────────────────────┤
│ Home | Escrows | Create | Feed │
└────────────────────────────────┘
```

- Use a compact header and labelled bottom navigation.
- Place Settings in the wallet or application menu.
- Keep important notices below the header, not as transient overlays.
- Respect device safe areas and avoid covering confirmation actions.

## 4. Dashboard wireframe

```text
Dashboard                                      [Create Escrow]
Connected: 0x…1234                 Network: GIWA [Supported]

[Action-required notice or wrong-network notice]

[Wallet balance] [Escrow value locked] [Pending] [Completed]

Agreements requiring action
[Agreement rows/cards with exact next actions]

Active escrows
[Funded or delivered agreements]

Recent activity                              [View all activity]
[Chronological events]
```

### Page heading

Use **Dashboard** with a concise account scope statement. Do not use promotional greetings as the primary heading.

### Wallet and network status

Show the shortened address, safe copy action, exact GIWA environment, synchronization state, and wrong-network guidance. Distinguish disconnected, loading, unsupported, and connected states.

### Primary action

Use **Create Escrow** when connected to the supported network. When disconnected, the contextual primary action may be **Connect wallet** without removing access to non-account product information.

### Financial summary cards

- **Wallet balance:** supported asset balance for the connected wallet on the displayed network.
- **Escrow value locked:** value currently held in agreements associated with this wallet; define buyer, seller, or combined scope.
- **Pending agreements:** non-terminal agreements; show precise breakdown or definition.
- **Completed agreements:** agreements with confirmed release; refunded and cancelled are not silently included.

Do not aggregate different assets without a real, timestamped valuation method. Do not present protocol-wide TVL, growth rates, earnings, or transaction volume unless sourced and defined.

### Agreements requiring action

Appears before general active escrows when non-empty. Each record contains agreement title or identifier, role, state, amount and asset, deadline when relevant, and exact next action.

### Active escrows

Shows non-terminal funded or delivered agreements that may not currently require the user. Provide a route to the complete collection.

### Recent activity

Shows the latest confirmed and pending events with agreement reference, event label, time, and transaction state. Limit the preview and link to Activity.

### Empty dashboard state

Explain that no agreements are associated with the connected wallet. Offer **Create Escrow** as the primary action and documentation as secondary help. A seller-facing account may instead be told how an agreement becomes associated with its address.

## 5. Create Escrow wireframe

### Flow structure

```text
Create Escrow
[1 Agreement] — [2 Payment] — [3 Review] — [4 Confirmation]

[Step heading]
[Step explanation]
[Fields / review content]

[Back]                                      [Continue]
```

Only one step is active. Completed steps may be revisited before wallet submission. Values persist when moving back.

### Step 1 — Agreement details

Field order:

1. **Title** — required; 3–80 trimmed characters. Helper: a recognizable reference for both parties.
2. **Description** — required; 20–2,000 characters. Helper: describe goods or services and important delivery context.
3. **Seller wallet address** — required; valid supported-chain address, not zero address, and not the buyer unless explicitly permitted.
4. **Delivery deadline** — required; future absolute date and time with timezone.

Errors appear immediately after the associated field and are linked programmatically. On Continue, an error summary appears before the step heading and focus moves to it.

### Step 2 — Payment details

Field order:

1. **Asset** — read-only **Test ETH**, the only asset supported by the MVP.
2. **Amount** — required positive value within supported decimal precision and contract limits.
3. **Protocol fee** — read-only `0 ETH`.
4. **Total deposit** — read-only and equal to the escrow amount; network gas is separate.
5. **GIWA network** — read-only **GIWA Sepolia** with chain ID `91342` and supported or wrong-network state.

Show the wallet balance only when retrieved successfully and label it by asset and network. Do not display a guessed fee, zero fee, or placeholder asset as real.

### Step 3 — Review

```text
Buyer              Full address
Seller             Full address
Agreement          Title and complete description
Deadline           Absolute date, time, and timezone
Amount             Exact amount and asset
Protocol fee       0 ETH
Total deposit      Exact escrow amount
Network            GIWA Sepolia · Chain ID 91342

Important escrow conditions
- Creation and funding state
- Release authority
- Refund eligibility
- Deadline behaviour
- Dispute limitation

[Back]                              [Create / Continue to wallet]
```

Keep financial values and counterparties above the action. Require an explicit acknowledgement only when legally or operationally necessary; never preselect it.

### Step 4 — Wallet confirmation

State sequence:

- **Awaiting signature:** “Review the escrow creation request in your wallet.” Explain that no transaction has been submitted.
- **Submitted:** Show the real transaction hash and exact network when available. Explain that submission is not confirmation.
- **Confirmation progress:** Show the current known confirmation state without inventing percentage completion.
- **Success:** After one GIWA block and verification of the resulting contract state, show the formatted `ACP-000001`-style identifier, Funded state, exact Test ETH amount, and next step. Creation and funding occur atomically.
- **Failure and recovery:** Preserve entered terms, state whether a transaction exists, explain the known failure, and offer a safe retry or agreement route.

### Navigation behaviour

- **Back:** Returns to the preceding editable step without clearing input.
- **Continue:** Validates the current step; it does not submit a wallet action before the final confirmation step.
- Browser navigation should warn before losing unsaved valid input only when loss is material.
- Prevent double submission while a wallet request or transaction is unresolved.

### Save draft

Save Draft is future scope. Do not imply drafts are stored, synchronized, private, or recoverable in the MVP. If added later, define storage location, wallet association, expiry, privacy, and deletion.

### Mobile behaviour

- Use one field column.
- Keep the step label concise and horizontally scrollable only when accessible.
- Place Back and Continue in normal reading order or a non-obscuring sticky action region.
- Ensure the on-screen keyboard does not hide errors or actions.
- Keep totals visible immediately before the wallet action.

## 6. My Escrows wireframe

```text
Escrows                                          [Create Escrow]
[Search by identifier, title, reference, or address]
[Status ▾] [Role: All/Buyer/Seller ▾] [More filters] [Sort ▾]
Showing N results                              [Clear filters]

Desktop: table
| Agreement | Role | Status | Amount | Counterparty | Updated | Action |

Mobile: cards
[Status] Agreement title
Role · Amount and asset
Counterparty
Updated / deadline
[Exact next action]
```

### Search

Search by agreement identifier, safe title text, external reference, or wallet address. Normalize address case and trim whitespace. Debounce remote queries and preserve safe query state in the URL.

### Filters and sorting

- Status: Created/Funded, Delivered, Released, Refunded, Cancelled, and Disputed.
- Role: All, Buyer, Seller.
- Additional filters: action required, asset, created range, deadline range.
- Default sort: action required first, then recently updated.
- Other sorts: recently updated, created date, deadline, status, and same-asset amount.

### Status labels

Use exact, sentence-case labels. Prefer **Awaiting funding**, **Awaiting delivery**, **Awaiting buyer review**, **Payment released**, **Refunded**, and **Cancelled** over a generic “Pending.”

### Actions

Each record receives one exact context action, such as **Fund agreement**, **Mark delivered**, **Review delivery**, or **View agreement**. Do not provide actions unauthorized by role or state.

### States

- **Empty:** No agreements for this wallet; offer Create Escrow or seller guidance.
- **No results:** Explain that search or filters caused the empty set; offer Clear filters.
- **Loading:** Preserve table or card structure with stable placeholders.
- **Error:** Explain whether retrieval failed, keep filters, and offer Retry.

## 7. Escrow Details wireframe

### Core structure

```text
Escrows / Agreement ACP-…

Agreement title                         [Exact status]
ACP-… · GIWA Sepolia

[Required next action and role-aware action panel]

Amount and asset        Deadline        Funding / settlement state

Buyer                   Seller
Full address            Full address

Agreement description and acceptance terms

Escrow lifecycle timeline
Created — Funded — Delivered — Released
               ↘ Refunded / Cancelled / Disputed

Contract and transaction details
Contract address | Creation transaction | Explorer links

Transaction activity
```

### Identity and financial summary

- Show the agreement title, `ACP-000001`-style display identifier, canonical numeric identifier, exact state, and **GIWA Sepolia** first.
- Show amount and asset without conversion unless a real valuation source exists.
- Show the absolute deadline with timezone and optional relative time.
- Show full buyer and seller addresses with safe copy controls.
- Never infer names or verification from wallet addresses.

### Contract address and creation transaction

Display only real values from the active deployment and agreement. Label the contract address separately from party addresses. Creation transaction status must distinguish submitted, confirmed, failed, or unavailable.

Explorer links must use verified GIWA Explorer destinations, open safely, and state what will be viewed. Do not invent an explorer URL.

### Agreement description

Show immutable or authoritative terms separately from later delivery content. Preserve meaningful whitespace and treat displayed content as untrusted text. Identify any non-contractual reference clearly.

### Lifecycle timeline

Show Created, Funded, Delivered, and Released as the ordinary path. Refunded and Cancelled are alternative terminal outcomes. Disputed is a future interrupting state. Use authoritative timestamps only. Do not mark a step complete based solely on wallet approval or submission.

### Required next action

Place one role- and state-specific summary above secondary information:

- What is required
- Who must act
- Relevant deadline
- Financial consequence
- Exact primary action

If no action is required, state what the agreement is waiting for and who acts next.

### Buyer view

The buyer sees:

- Their role identified explicitly.
- Confirmation that creation and Test ETH funding occurred atomically, or the exact unresolved transaction state.
- Seller delivery status and submitted information.
- **Release funds** only after the contract permits release.
- Eligible refund or cancellation action with exact conditions.
- **Raise dispute** only when the MVP contract permits it, with the designated testnet resolver model disclosed.
- Confirmation dialogs that restate amount, seller, network, fee, and resulting state.

The buyer must never see release as a routine “Continue” action.

### Seller view

The seller sees:

- Their role identified explicitly.
- A prominent distinction between a submitted creation transaction and the confirmed atomically created-and-funded state.
- **Mark delivered** only when the contract permits it.
- Delivery-submission requirements and permanence.
- Waiting-for-buyer-review status after delivery.
- Settlement transaction after confirmed release.
- Refund or dispute consequences when relevant.

The seller must never be encouraged to deliver before funding is confirmed.

### Role-aware action panel

The panel derives actions from the connected address, exact network, contract state, deadline, and authorization. It contains one primary action, relevant consequences, and secondary actions only when genuinely available.

If the viewer is neither party, show a read-only state. Do not present a connection action as though it will grant authorization.

### Release funds action

Available only to the authorized buyer in a valid state. The confirmation names the seller, amount, asset, network, irreversibility, and resulting Released state. Success appears only after confirmation.

### Mark delivered action

Available only to the seller in a valid funded state. Collect or display contract-supported delivery information, explain visibility and permanence, and identify that submission begins buyer review where applicable.

### Refund action

Available only when contract rules permit it. State refund amount, asset, destination, eligibility basis, network, fee if any, and terminal state. Do not imply that a request guarantees execution.

### Dispute action

Buyer or seller may raise a dispute when the MVP contract permits it. The confirmation explains that the action freezes funds and that a designated resolver may resolve the testnet dispute. Show the resolver model and resulting Disputed state without calling the process decentralised arbitration. Full arbitration governance remains future scope.

### Transaction activity

List event type, actor role, amount when relevant, timestamp, transaction hash, confirmation state, and verified explorer link. Preserve failed and replaced transactions when useful to explain history.

### Security notices

Use contextual notices for wrong network, unconfirmed funding, deadline conditions, irreversible release, unsupported dispute handling, or unavailable contract data. Avoid generic shields or claims that the agreement is “safe.”

### Confirmation dialogs

Consequential dialogs include action, agreement identifier, amount and asset, source/destination role, exact network, fee, resulting state, and reversibility. Closing never submits. Focus returns to the invoking control.

### Success states

Confirm the exact completed action and new authoritative agreement state. Show real transaction details and the next useful destination.

### Failure states

Preserve the prior authoritative state. Explain whether the wallet rejected, submission failed, confirmation failed, RPC is unavailable, or contract data is delayed. Never imply duplicate submission is safe without checking transaction state.

## 8. Transaction Activity wireframe

```text
Activity
Account: 0x…1234 · GIWA Sepolia · Last updated …

[Event type ▾] [Role ▾] [Status ▾] [Date range] [Clear]

Date
[Event] [Escrow ACP-…] [Buyer/Seller] [Amount]
[Timestamp] [Transaction status] [Hash] [View on GIWA Explorer]
```

Each record defines:

- **Event type:** Created/Funded, Delivered, Released, Refunded, Cancelled, Disputed, or Dispute Resolved.
- **Escrow identifier:** canonical identifier linked to details.
- **Wallet role:** Buyer, Seller, or Viewer where meaningful.
- **Amount:** exact amount and asset only when relevant to the event.
- **Timestamp:** authoritative date, time, and timezone.
- **Transaction hash:** shortened visually with full accessible value and copy action.
- **Status:** submitted, confirmed, failed, replaced, or unavailable.
- **Explorer link:** verified GIWA Explorer link only.

Filters cover event type, role, transaction state, agreement, and date. The empty state distinguishes no activity from no filtered matches. Never manufacture events to demonstrate the screen.

## 9. Settings wireframe

```text
Settings

Connected wallet
0x…1234                                      [Copy] [Disconnect]
Connection is not an AccordPay account.

Network information
GIWA Sepolia · Chain ID 91342 · Supported state

Display
Theme / density / time format, only when implemented

Notifications — Future
Description of planned preferences; no enabled controls
```

- **Connected wallet:** Show address and connection state. Disconnect removes the local application connection; it does not revoke blockchain activity or delete an account.
- **Preferred display settings:** Include only implemented local preferences. State storage behaviour.
- **Notification preferences:** Future scope. Do not show functional email or push controls before delivery systems and consent exist.
- **Disconnect wallet:** Require confirmation only if unsaved work would be lost. Do not call it “Log out.”
- **Network information:** Show exact network name, chain identifier from verified configuration, and support status.

Do not imply username/password authentication, profiles, custody, or account recovery.

## 10. System states

| State                       | Message title                           | Supporting message                                                                                                                         | Primary action                 | Secondary action               | Must never imply                                          |
| --------------------------- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------ | ------------------------------ | --------------------------------------------------------- |
| Wallet disconnected         | Connect a wallet to continue            | Connect a supported wallet to view agreements for an address or perform an action.                                                         | Connect wallet                 | View documentation             | That connection creates an account or transfers funds     |
| Wrong network               | Switch to GIWA Sepolia                  | This action requires GIWA Sepolia (chain ID `91342`); the current network is unsupported.                                                  | Switch network                 | Continue read-only             | That switching submits the escrow transaction             |
| Wallet rejected transaction | Transaction not approved                | The wallet request was rejected. No new transaction was submitted by AccordPay.                                                            | Try again                      | Return to agreement            | That rejection is an on-chain failure or that funds moved |
| Transaction pending         | Transaction submitted                   | The transaction is awaiting network confirmation on the named GIWA environment.                                                            | View transaction               | Return to agreement            | That submission equals confirmation                       |
| Transaction confirmed       | Transaction confirmed                   | The named action is confirmed and the agreement is now in the exact displayed state.                                                       | View agreement                 | View on explorer               | That unrelated later steps are complete                   |
| Transaction failed          | Transaction failed                      | The network did not confirm the requested action. The agreement remains in the displayed prior state unless refreshed data says otherwise. | Review and retry               | View transaction               | That retry is always safe or that funds are lost          |
| RPC unavailable             | Network data is temporarily unavailable | AccordPay cannot currently retrieve reliable data from the configured GIWA RPC.                                                            | Retry                          | View known data read-only      | That cached values are current                            |
| Contract data unavailable   | Agreement data could not be verified    | AccordPay cannot currently read the authoritative contract state for this agreement.                                                       | Retry                          | View transaction reference     | That the agreement is missing, cancelled, or safe         |
| Invalid seller address      | Enter a valid seller address            | The value is not a valid supported-chain address or cannot be used for this agreement.                                                     | Return to field                | Address guidance               | That AccordPay knows who owns an address                  |
| Insufficient balance        | Balance is too low                      | This wallet does not have enough of the exact asset to cover the displayed deposit and known fee.                                          | Review amount                  | Return to dashboard            | That a swap, deposit, or credit facility exists           |
| Deadline passed             | The delivery deadline has passed        | The agreement is past its defined deadline. Available actions depend on its current contract state.                                        | View available action          | View terms                     | That a refund or cancellation happened automatically      |
| Agreement already completed | This agreement is complete              | The agreement has already reached the displayed terminal state.                                                                            | View settlement details        | View activity                  | That another release or refund is possible                |
| User not authorised         | This wallet cannot perform that action  | The connected address is not authorized for this action in the agreement’s current state.                                                  | View agreement read-only       | Connect another wallet         | That connecting any wallet grants permission              |
| Empty state                 | No agreements to show                   | No agreements match this wallet and current filters.                                                                                       | Create Escrow or Clear filters | Learn how it works             | That records were deleted                                 |
| Loading state               | Loading agreement data                  | AccordPay is retrieving current information from the configured network.                                                                   | None initially                 | Retry after a meaningful delay | That the expected result is already true                  |
| 404                         | Page not found                          | The route or agreement reference could not be found from this location.                                                                    | Go to Escrows                  | Go to Dashboard                | That a valid on-chain agreement was deleted               |

Messages must insert real network, asset, amount, agreement, and state values when those values are known.

## 11. Responsive rules

### 320px mobile

- Use a 4-column conceptual grid and 16px gutters.
- Show one content column.
- Use full-width form controls and stacked action groups.
- Allow identifiers to wrap or truncate with a full-value affordance.
- Replace data tables with structured cards.
- Keep bottom navigation labels visible.
- Avoid fixed-width content, horizontal page scrolling, and side-by-side financial summaries.

### 480px mobile

- Retain the mobile shell with additional breathing room.
- Allow selected paired fields or summary values only when each remains readable.
- Keep confirmation totals and actions in one clear vertical sequence.
- Public header may show Launch App outside the menu when space permits.

### 768px tablet

- Use an 8-column grid and 24px gutters.
- Permit two-column form groupings for short, related fields.
- Use a compact sidebar only if navigation labels remain available; otherwise retain mobile navigation.
- Summary widgets may form a two-column grid.
- Tables may appear only when essential columns fit without hiding meaning.

### 1024px desktop

- Use a 12-column grid.
- Introduce the persistent application sidebar.
- Use 24px grid gaps and up to 32px outer gutters.
- Place role-aware actions beside supporting details when reading order remains clear.
- Show desktop tables with stable columns.

### 1280px and above

- Constrain standard content to 1200px and operational content to 1440px.
- Do not stretch forms or prose to fill available width.
- Use extra width for context, parallel comparison, and persistent action summaries.
- Preserve alignment rather than adding decorative empty panels.

All widths must support 200% text resizing, keyboard navigation, and reduced motion.

## 12. Content and trust rules

- Use plain language and define unavoidable technical terms.
- State the exact transaction status: awaiting wallet, submitted, confirmed, failed, replaced, or unavailable.
- State the exact network name: **GIWA Sepolia**.
- Show the exact asset and amount; never silently combine assets.
- Make no false guarantee of security, settlement, refund, timing, or availability.
- Do not claim funds are safe before contracts are implemented, tested, and independently assessed as appropriate.
- Do not use an **Audited** label unless a real audit exists and is linked accurately with scope and date.
- Disclose every implemented protocol fee before wallet confirmation.
- Explain whether a displayed network fee is exact, estimated, wallet-calculated, or unavailable.
- Do not say “Complete” when a wallet has only approved or submitted a transaction.
- Never present mock, example, seeded, or placeholder data as real.
- Clearly label educational examples.
- Do not invent contract addresses, transaction hashes, explorer links, integrations, partners, testimonials, customers, or statistics.
- Identify AccordPay as independent and GIWA as the supported network.
- Never request a seed phrase or private key.

## 13. MVP build order

1. **Application shell:** establishes navigation, wallet and network context, notices, page hierarchy, and responsive behaviour used everywhere else.
2. **Create Escrow:** defines the agreement data model, validation, fee disclosure, review pattern, and transaction-state feedback.
3. **Escrow Details:** provides the authoritative lifecycle, party roles, contract data, and financial action model.
4. **My Escrows:** makes created agreements retrievable and tests search, filtering, status, role, and responsive records.
5. **Dashboard:** summarizes real data only after agreement definitions and actions exist.
6. **Landing page:** explains a working, accurately scoped product after its core interaction language is established.
7. **Activity:** expands agreement-level transaction history into an account-wide operational record.
8. **Settings:** adds limited connection and display preferences after the application shell is stable.
9. **System states and 404:** implement shared state patterns alongside each earlier screen, then complete a dedicated consistency and edge-case pass here.

System states are listed ninth as a consolidation milestone, not permission to defer critical error, empty, loading, and transaction feedback from the screens that need them.

## Screen inventory

| Screen or surface    | Audience                       | Primary objective                                      | MVP priority |
| -------------------- | ------------------------------ | ------------------------------------------------------ | ------------ |
| Public shell         | Visitor                        | Navigate product information and launch the app        | High         |
| Landing page         | Visitor                        | Understand value, trust model, and product maturity    | Medium       |
| Application shell    | Connected or disconnected user | Maintain navigation, wallet, network, and page context | High         |
| Dashboard            | Buyer or seller                | Find obligations and recent state quickly              | High         |
| Create Escrow        | Buyer                          | Define, review, and confirm a new agreement            | High         |
| My Escrows           | Buyer or seller                | Retrieve and manage relevant agreements                | High         |
| Escrow Details       | Buyer, seller, or viewer       | Understand and act on authoritative agreement state    | Highest      |
| Transaction Activity | Buyer or seller                | Inspect chronological product and on-chain events      | Medium       |
| Settings             | Wallet user                    | Manage connection and implemented display preferences  | Low          |
| System states        | All                            | Explain interruptions, progress, and recovery safely   | High         |
| 404                  | All                            | Recover from an invalid route or reference             | Medium       |

## Component inventory preview

This inventory identifies likely reusable responsibilities; it does not prescribe React components or implementation boundaries.

| Candidate                       | Responsibility                                              |
| ------------------------------- | ----------------------------------------------------------- |
| Public header and footer        | Public navigation, product identity, attribution            |
| Application sidebar             | Persistent desktop application navigation                   |
| Mobile application navigation   | Mobile header, menu, and bottom destinations                |
| Wallet control                  | Connection status, address display, copy, disconnect        |
| Network indicator               | Exact GIWA environment and support state                    |
| Page header                     | Breadcrumbs, title, context, and primary action             |
| Notice                          | Information, warning, error, and persistent system messages |
| Metric summary                  | A defined value, scope, freshness, and unavailable state    |
| Agreement record                | Agreement identity, role, state, amount, and next action    |
| Status chip                     | Exact state using text, icon, and semantic colour           |
| Search and filter controls      | Query, facets, sort, count, and clearing                    |
| Data table / mobile record      | Responsive collection representation                        |
| Form field group                | Label, control, helper, requirement, and error              |
| Step progress                   | Multi-step creation status and navigation                   |
| Financial review summary        | Parties, amount, fee, total, network, conditions            |
| Transaction status              | Wallet request, submission, confirmation, failure           |
| Lifecycle timeline              | Authoritative agreement events and terminal branches        |
| Role-aware action panel         | Authorized action, consequences, and waiting state          |
| Confirmation dialog             | Consequential action review and explicit confirmation       |
| Activity event                  | Product event and associated transaction evidence           |
| Empty, loading, and error state | Context, stable structure, and safe recovery                |

## Open UX decisions

Network, wallet, transaction, asset, fee, refund, data, identifier, confirmation, navigation, identity, dispute, and disclosure questions are resolved in [`MVP-DECISIONS.md`](./MVP-DECISIONS.md). The following implementation-level decisions genuinely remain open:

1. Is there a contract-enforced buyer review window after delivery, or may the buyer release at any time while the escrow remains delivered?
2. Which permitted delivery reference form will the MVP use: metadata hash, content-addressed URI, evidence reference, or a defined combination?
3. Which off-chain storage and indexing system powers agreement titles, descriptions, lists, search, delivery notes, and activity, and how is stale data communicated?
4. What verified GIWA Explorer path patterns should be used for transaction, address, block, and contract links beneath the approved explorer base URL?
5. Will the MVP provide a public read-only Escrow Details route, and which off-chain fields are safe to expose there?
6. Which light-mode display settings, if any, are valuable enough for the initial Settings screen?
7. What support and recovery path applies when the GIWA RPC, transaction receipt, contract read, and off-chain index disagree?
8. What metadata schema, validation, versioning, and content-integrity rules govern the off-chain agreement reference?
9. What testnet resolver address and operational procedure will be designated for disputes, and how will resolver decisions be documented?
10. What marketplace-intent format, trust boundary, and callback model may be explored after the standalone MVP?

## Acceptance criteria for beginning UI implementation

- Product, engineering, contract, and design stakeholders approve the MVP state model.
- The supported GIWA environment is confirmed from authoritative documentation.
- Supported assets, address format, fee model, and transaction sequence are defined.
- Buyer and seller permissions are mapped for every contract state.
- Cancellation, refund, deadline, and dispute limitations are documented.
- The data source and freshness model for lists, details, and activity are selected.
- Public versus wallet-gated agreement data is approved.
- All consequential actions have approved review content and success criteria.
- Error states distinguish wallet, RPC, transaction, contract, and indexing failures.
- The responsive information hierarchy is accepted at 320px, 480px, 768px, 1024px, and 1280px.
- Accessibility requirements cover focus, semantics, errors, status announcements, dialogs, touch targets, zoom, and reduced motion.
- Example data policy prevents mock content from appearing real.
- No unverified contract address, explorer URL, integration, fee, audit, or security claim is required by the proposed UI.
- The approved design tokens and brand guidance can support every specified state.
- Implementation tickets can trace each screen back to this specification and `UX-ARCHITECTURE.md`.

Only after these criteria are satisfied should detailed visual design and UI implementation begin.
