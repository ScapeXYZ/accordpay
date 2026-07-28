# AccordPay UX Architecture

## Purpose and scope

This document defines the intended AccordPay product experience before interface implementation. It describes information architecture, user journeys, screen responsibilities, interaction rules, and system feedback. It is not a wireframe or visual layout specification.

The first MVP centres on a single-payment agreement between one buyer and one seller on a supported GIWA Chain environment. Marketplace integration, formal dispute resolution, and administration are architectural considerations for later phases unless explicitly added to the approved MVP scope.

## 1. User types

### Buyer

The buyer creates or accepts agreement terms, funds escrow, reviews delivery, releases payment, and requests an eligible cancellation or refund. The buyer needs confidence that the terms, amount, seller, asset, network, and consequences are clear before committing funds.

Primary needs:

- Create an accurate agreement.
- Verify the seller and terms before funding.
- Understand where funds are in the lifecycle.
- Review delivery evidence or information.
- Release payment or follow an eligible refund path.
- Inspect an authoritative activity history.

### Seller

The seller reviews agreement terms, confirms whether they are willing to fulfil them, monitors funding, delivers the agreed work or goods, marks delivery, and receives released payment. The seller needs assurance that escrow is funded before fulfilling the agreement.

Primary needs:

- Verify buyer, amount, deadline, and acceptance terms.
- Distinguish a draft or unfunded agreement from secured funds.
- Submit delivery information clearly.
- Track buyer review and settlement.
- Understand cancellation, refund, and dispute conditions.

### Marketplace

A marketplace is a future integrating platform that may create escrow intents, supply transaction context, direct parties into AccordPay, and receive status updates. It must never be able to represent a wallet signature or completed on-chain action that did not occur.

Primary needs:

- Pass validated agreement context into a documented integration boundary.
- Associate an AccordPay agreement with its own order identifier.
- Return users safely to the originating marketplace.
- Observe reliable lifecycle states and transaction references.
- Present AccordPay as an independent settlement provider.

Marketplace integration is not part of the initial standalone MVP unless separately approved.

### Administrator (future)

An administrator may support operations, investigate reported issues, manage allowlisted configuration, and observe system health. An administrator must not silently alter an agreement, impersonate a party, or move escrowed funds unless a future contract and governance model explicitly permits and exposes that power.

Primary needs:

- Review operational events and support references.
- Inspect public agreement and transaction state.
- Manage approved non-custodial configuration under auditable controls.
- Identify abuse patterns without accessing private keys.
- Use least-privilege, strongly authenticated administrative tools.

No administrator interface is included in the first MVP.

## 2. Main navigation

### Public navigation

- **Landing:** explains the problem, AccordPay’s solution, and the route into the product.
- **About:** describes AccordPay’s purpose, principles, network relationship, and product maturity.
- **Documentation:** provides user, developer, contract, network, and risk documentation.
- **Launch App:** moves users from public information into the application. It is the primary public navigation action.

Public navigation must distinguish educational content from transactional product areas. “Launch App” must not imply wallet connection or agreement creation has already occurred.

### Application navigation

- **Dashboard:** summarizes obligations, states, and the next useful actions.
- **Escrows:** opens the complete list of agreements relevant to the connected account.
- **Create Escrow:** begins a new buyer-led agreement.
- **Activity:** shows chronological transaction and agreement events.
- **Settings:** manages user-controlled preferences and supported connection information.

Application navigation must remain usable before wallet connection. Account-specific destinations may show a connection requirement, but navigation itself should not disappear.

## 3. Complete user flows

### Buyer flow

1. Enter the application from the public site or a trusted direct route.
2. Connect a supported wallet.
3. Switch to the supported GIWA network if necessary.
4. Open **Create Escrow**.
5. Enter the seller, amount, asset, description, deadline, and acceptance terms.
6. Review normalized terms and warnings.
7. Create the agreement through the required wallet confirmation.
8. Confirm that creation has been recorded.
9. Fund the agreement through a separate, explicit wallet action when required by the contract design.
10. Monitor the agreement until the seller submits delivery.
11. Review delivery information and the original acceptance terms together.
12. Release payment, request an eligible refund or cancellation, or enter the supported dispute path.
13. Review the final agreement state and transaction reference.

At each consequential step, show the exact amount, asset, counterparty, network, resulting state, and whether the action is reversible.

### Seller flow

1. Receive an agreement reference through AccordPay or a trusted external channel.
2. Open **Escrow Details** without being forced to connect a wallet for public-safe information.
3. Connect the wallet matching the designated seller address.
4. Switch to the supported GIWA network if necessary.
5. Review the buyer, amount, asset, terms, deadline, and current funding state.
6. Do not begin fulfilment based solely on a draft, submitted transaction, or unconfirmed funding state.
7. After confirmed funding, fulfil the agreement.
8. Submit delivery information and confirm the delivery action.
9. Monitor buyer review.
10. Receive payment after confirmed release, or follow the refund or dispute state if initiated.
11. Review final settlement and activity history.

The seller experience must emphasize the difference between agreement creation and confirmed escrow funding.

### Marketplace integration flow

1. The marketplace constructs an escrow intent using documented, validated fields.
2. AccordPay receives the intent and identifies the originating marketplace without treating it as a trusted signer.
3. The user reviews all imported terms inside AccordPay.
4. AccordPay rejects missing, malformed, expired, or unsupported parameters.
5. The buyer connects a wallet and confirms the network.
6. The buyer creates and funds the agreement through explicit wallet actions.
7. AccordPay associates the resulting agreement identifier with the marketplace reference.
8. Lifecycle changes become available through a future authenticated callback, polling, or indexing interface.
9. The user may return to the marketplace through a validated destination.

Imported content must never bypass review, validation, authorization, or wallet confirmation. Return destinations must be allowlisted or otherwise protected against open redirects.

### Dispute flow

Formal decentralized arbitration is excluded from the first MVP. The architecture reserves a dispute state so the product does not force a false success or refund outcome when parties disagree.

Future flow:

1. An eligible party selects **Raise dispute** and sees the consequences.
2. The party chooses a reason and supplies structured context.
3. AccordPay summarizes the claim and identifies what information may become public or shared.
4. The party confirms the dispute action.
5. The agreement enters **Disputed**, preventing ordinary release or refund paths according to the future contract rules.
6. The counterparty is notified and given a response deadline.
7. An approved resolution mechanism evaluates the case.
8. Both parties see the decision, rationale category, settlement action, and transaction result.

Until a real resolution mechanism exists, the UI must not offer a functional dispute action or claim that AccordPay can arbitrate disputes. MVP documentation must explain the available cancellation and refund limits before funding.

### Refund flow

1. An eligible party opens **Escrow Details**.
2. The interface evaluates contract state and explains whether a refund path is available.
3. The user reviews the amount, destination, reason or condition, and resulting agreement state.
4. The user confirms the refund request or action in the wallet.
5. The interface distinguishes wallet approval, transaction submission, network confirmation, and final contract state.
6. On confirmation, the agreement timeline records **Refunded** and shows the real transaction reference.
7. If ineligible or failed, the agreement remains in its authoritative prior state and the user receives a specific recovery message.

The interface must not promise a refund merely because a transaction was submitted.

### Wallet connection flow

1. The user selects **Connect wallet** in context.
2. AccordPay explains why connection is needed and lists supported connection methods.
3. The user chooses a wallet through the future approved wallet layer.
4. The wallet handles account authorization.
5. AccordPay verifies the returned account and network without requesting secret material.
6. If supported, the interface restores the user’s intended destination.
7. The application displays a shortened address with access to the full address.

Connection is not authentication unless a future signed-session design explicitly establishes it. AccordPay must never request a seed phrase or private key.

### Network switching flow

1. AccordPay detects an unsupported or incorrect network.
2. A persistent contextual notice states the current and required network.
3. The user selects **Switch to GIWA**.
4. The wallet receives a network-switch request.
5. If the network is unavailable, AccordPay may request addition using configuration from verified GIWA documentation.
6. The application revalidates chain identity after the wallet reports success.
7. The user returns to the interrupted action only after validation.

If the user rejects switching, the application remains readable and disables only actions that require the supported network.

## 4. Every screen

### Landing

Public introduction to AccordPay. It establishes the problem, trust model, core transaction flow, GIWA network support, current product maturity, and a clear route to launch or learn more. It must not show fake agreements, metrics, integrations, addresses, or audit claims.

### Dashboard

Account-specific operational overview. It prioritizes pending obligations and next actions over promotional content or vanity metrics. Without a connected wallet, it explains the benefit of connection and preserves navigation.

### Create Escrow

Buyer-led form and review flow for defining a single-payment agreement. It separates data entry, term review, wallet confirmation, transaction submission, and confirmed creation. Funding is presented as a distinct step if the contract lifecycle requires it.

### Escrow Details

Authoritative view of one agreement. It presents state, amount, asset, parties, terms, deadline, timeline, available actions, and real transaction history. Role-aware actions derive from the connected address and current contract state.

### My Escrows

Searchable and filterable collection of agreements associated with the connected address. It distinguishes the user’s role, agreement state, amount, counterparty, deadline, and next action.

### Transaction Activity

Chronological record of agreement events and on-chain transactions relevant to the connected account. It distinguishes a product event from a submitted, confirmed, failed, or replaced transaction.

### Settings

User-controlled display, notification, privacy, and connection preferences. It shows the connected account and network but does not expose seed phrases, private keys, or misleading custody controls.

### 404

Explains that the requested location does not exist or is unavailable. It provides safe routes to the dashboard, escrows, or public landing page without suggesting that an unknown agreement was deleted.

### Empty states

Context-specific states for new accounts, no search results, no matching filters, missing activity, or unavailable account data. Each state explains why the area is empty and offers at most one primary recovery or creation action.

### Loading states

Stable representations for initial data retrieval, route transitions, wallet requests, transaction submission, and network confirmation. They communicate what is happening without presenting an unconfirmed financial outcome.

## 5. Every page section

### Landing sections

| Section                | Why it exists                        | Purpose                                                                        |
| ---------------------- | ------------------------------------ | ------------------------------------------------------------------------------ |
| Public header          | Establishes orientation and trust    | Provides public navigation and a clear Launch App action                       |
| Hero                   | Communicates immediate relevance     | States AccordPay’s value, tagline, maturity, and primary next step             |
| Problem                | Grounds the product in user risk     | Explains buyer and seller uncertainty without fear-based language              |
| Solution               | Defines AccordPay’s role             | Introduces verified escrow and programmable settlement                         |
| How it works           | Reduces conceptual complexity        | Explains creation, funding, delivery, and settlement                           |
| Buyer and seller value | Maintains balanced positioning       | Shows distinct benefits without favouring one party                            |
| Trust model            | Prevents false assumptions           | Explains wallet responsibility, contract state, limitations, and confirmations |
| GIWA network           | Identifies infrastructure accurately | Presents GIWA as the supported network, not AccordPay’s owner                  |
| MVP status             | Sets honest expectations             | States current availability, exclusions, and unaudited status where applicable |
| Final action           | Gives a clear next step              | Routes users to the application or documentation                               |
| Public footer          | Provides durable reference paths     | Links documentation, policies, project information, and network attribution    |

### Dashboard sections

| Section                      | Why it exists                | Purpose                                                          |
| ---------------------------- | ---------------------------- | ---------------------------------------------------------------- |
| Context header               | Identifies account and scope | Shows page title, connected account, network, and refresh status |
| Attention queue              | Prevents missed obligations  | Lists agreements requiring the user’s action                     |
| Summary widgets              | Supports rapid orientation   | Shows balances and agreement counts with clear definitions       |
| Quick actions                | Reduces repeated navigation  | Offers Create Escrow, View Escrows, and other valid shortcuts    |
| Recent activity              | Provides immediate history   | Shows the latest meaningful agreement and transaction events     |
| Connection or empty guidance | Supports first use           | Explains how to begin when account data is unavailable or empty  |

### Create Escrow sections

| Section              | Why it exists                          | Purpose                                                                 |
| -------------------- | -------------------------------------- | ----------------------------------------------------------------------- |
| Progress and context | Reduces form uncertainty               | Shows the current step and preserves the creation objective             |
| Parties              | Establishes agreement participants     | Captures and validates the buyer context and seller address             |
| Payment              | Defines financial commitment           | Captures amount, supported asset, and network                           |
| Agreement terms      | Defines expected exchange              | Captures title, description, acceptance terms, and deadline             |
| Optional references  | Supports real commerce context         | Captures safe external or marketplace references                        |
| Review               | Prevents avoidable irreversible errors | Presents normalized terms and key warnings before wallet action         |
| Confirmation status  | Separates intent from outcome          | Shows wallet request, submission, confirmation, and resulting agreement |

### Escrow Details sections

| Section                   | Why it exists                     | Purpose                                                                   |
| ------------------------- | --------------------------------- | ------------------------------------------------------------------------- |
| Identity header           | Confirms the viewed agreement     | Shows title, identifier, status, and network                              |
| Primary financial summary | Prioritizes value at risk         | Shows amount, asset, funding state, and settlement destination            |
| Next action               | Guides the current role           | Presents one clear role- and state-valid primary action                   |
| Parties                   | Prevents counterparty ambiguity   | Shows full buyer and seller addresses with safe copy behaviour            |
| Terms                     | Preserves the original agreement  | Shows description, acceptance criteria, deadline, and creation time       |
| Delivery                  | Connects fulfilment to acceptance | Shows delivery status and submitted information                           |
| Timeline                  | Explains progression              | Displays completed, current, unavailable, and terminal states             |
| Transactions              | Supports verification             | Lists real hashes, state, time, and verified explorer destinations        |
| Risk and limitations      | Prevents false confidence         | Explains relevant irreversibility, refund, dispute, or timing constraints |

### My Escrows sections

| Section                    | Why it exists                  | Purpose                                                     |
| -------------------------- | ------------------------------ | ----------------------------------------------------------- |
| Header and create action   | Establishes collection scope   | Shows title, count definition, and Create Escrow entry      |
| Search and filters         | Supports retrieval             | Finds agreements by known identifiers and meaningful facets |
| Results summary            | Makes filtering legible        | States active query, filters, sort, and result count        |
| Agreement collection       | Supports comparison and action | Shows consistent agreement records with next actions        |
| Pagination or continuation | Controls data volume           | Loads more results without losing filter and scroll context |
| Empty or no-results state  | Explains absence               | Distinguishes no agreements from no matches                 |

### Transaction Activity sections

| Section              | Why it exists                    | Purpose                                                          |
| -------------------- | -------------------------------- | ---------------------------------------------------------------- |
| Activity header      | Defines scope and freshness      | Shows account, network, and last synchronization state           |
| Activity filters     | Reduces noise                    | Filters by event, transaction state, role, and time              |
| Chronological feed   | Creates an audit-oriented record | Presents clear events grouped by date                            |
| Event details        | Supports verification            | Shows related agreement, actor, amount, transaction, and outcome |
| Continuation control | Handles long histories           | Retrieves older events while preserving context                  |

### Settings sections

| Section                        | Why it exists                  | Purpose                                                                        |
| ------------------------------ | ------------------------------ | ------------------------------------------------------------------------------ |
| Account and network            | Clarifies current connection   | Displays address, supported network, and safe disconnect control               |
| Display preferences            | Supports usability             | Manages theme, density, locale, or time display when implemented               |
| Notification preferences       | Supports relevant updates      | Controls available notification channels without implying unsupported delivery |
| Privacy and safety             | Reinforces user control        | Explains local data, wallet safety, and external-link behaviour                |
| Developer or advanced settings | Prevents accidental complexity | Contains future optional technical preferences, separated from core use        |

### 404 sections

| Section         | Why it exists                   | Purpose                                                             |
| --------------- | ------------------------------- | ------------------------------------------------------------------- |
| Clear status    | Explains the navigation failure | States that the page cannot be found                                |
| Safe guidance   | Prevents dead ends              | Links to Dashboard, Escrows, or Landing                             |
| Reference check | Helps with agreement URLs       | Suggests checking the identifier without exposing unrelated records |

### Empty-state sections

| Section        | Why it exists        | Purpose                                                           |
| -------------- | -------------------- | ----------------------------------------------------------------- |
| State heading  | Names the absence    | Distinguishes new, filtered, disconnected, and unavailable states |
| Explanation    | Provides context     | Explains why no content is shown                                  |
| Primary action | Enables recovery     | Offers the single most relevant next step                         |
| Secondary help | Supports uncertainty | Links documentation only when useful                              |

### Loading-state sections

| Section            | Why it exists                | Purpose                                                     |
| ------------------ | ---------------------------- | ----------------------------------------------------------- |
| Stable placeholder | Prevents layout shift        | Preserves expected content structure                        |
| Process label      | Explains active work         | Names loading, wallet approval, submission, or confirmation |
| Delayed guidance   | Handles long waits           | Explains what the user may safely do                        |
| Recovery           | Prevents indefinite blocking | Offers retry only when retrying is safe                     |

## 6. Dashboard widgets

### Wallet Balance

Shows supported-asset balance for the connected address on the active GIWA network. It exists to help the buyer determine whether funding is possible. It must state the asset and network, avoid implying custody by AccordPay, and distinguish unavailable data from a zero balance.

### Escrow Value Locked

Shows the connected account’s value currently held across relevant funded agreements. It must define whether the value covers the user as buyer, seller, or both and must not imply protocol-wide total value locked. Mixed assets must not be added into a misleading total without a transparent valuation method.

### Pending Agreements

Shows non-terminal agreements associated with the account, with emphasis on items requiring action. “Pending” must be decomposed into precise states such as awaiting funding, awaiting delivery, or awaiting review.

### Completed Agreements

Shows agreements that reached confirmed release or another explicitly defined terminal completion state. Refunded and cancelled agreements should not be counted as successful settlements unless the label makes that definition clear.

### Recent Activity

Shows the latest meaningful product and transaction events. Each item identifies the agreement, event, time, and confirmation state. It is a preview of the complete Activity screen.

### Quick Actions

Provides direct access to Create Escrow, View Escrows, and context-valid actions. It should contain a small, stable set rather than duplicate every navigation destination.

## 7. Create Escrow form

### Fields

| Field                 | Required                          | Validation                                                                                | Purpose                                                |
| --------------------- | --------------------------------- | ----------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| Buyer address         | Derived and required              | Must equal the connected authorized account and be valid for the supported chain          | Identifies the funding party                           |
| Seller address        | Required                          | Valid address, not zero address, not identical to buyer unless explicitly supported later | Identifies the receiving party                         |
| Agreement title       | Required                          | 3–80 characters after trimming; plain text                                                | Gives both parties a recognizable reference            |
| Description           | Required                          | 20–2,000 characters; sanitized display; no executable content                             | Defines the goods or services                          |
| Acceptance terms      | Required                          | 20–2,000 characters; specific enough for review                                           | Defines what qualifies for release                     |
| Amount                | Required                          | Positive supported precision; within contract and asset limits; not zero                  | Defines escrowed value                                 |
| Asset                 | Required                          | Must be explicitly supported on the selected GIWA network                                 | Defines the payment instrument                         |
| Delivery deadline     | Required                          | Valid future date and time; after a minimum review window; clearly zoned                  | Defines expected fulfilment timing                     |
| Review window         | Required if supported by contract | Within documented minimum and maximum                                                     | Defines buyer review timing                            |
| External reference    | Optional                          | Maximum 120 characters; treated as untrusted text                                         | Associates an order or invoice reference               |
| Marketplace reference | Optional and integration-only     | Validated format and trusted integration context                                          | Associates a future marketplace order                  |
| Delivery instructions | Optional                          | Maximum 1,000 characters; must not request secrets                                        | Adds practical fulfilment context                      |
| Agreement note        | Optional                          | Maximum 500 characters; clearly non-contractual if not stored in terms                    | Adds private or contextual information where supported |

### Validation rules

- Validate on blur and on submission without interrupting normal typing.
- Preserve valid values when another field fails.
- Display errors beside the relevant field and summarize them at submission.
- Normalize addresses, dates, asset precision, and whitespace before review.
- Revalidate supported network, asset, balance, allowance, and contract constraints immediately before wallet action.
- Warn when the seller is the connected account, the deadline is unusually close, or terms appear empty after normalization.
- Never claim an address belongs to a known person without verified identity data.
- Treat pasted external content as untrusted.
- Separate field validity from wallet rejection and contract failure.

Required and optional fields must be labelled explicitly. A visual asterisk alone is insufficient.

## 8. Escrow timeline

The timeline reflects authoritative agreement events, not an assumed linear checklist. Some terminal states replace later steps, and **Disputed** may interrupt the normal path.

| State     | Meaning                                                      | UX treatment                                                                       |
| --------- | ------------------------------------------------------------ | ---------------------------------------------------------------------------------- |
| Created   | Terms exist and the agreement identifier is confirmed        | State clearly that funds are not necessarily secured                               |
| Funded    | Required funds are confirmed in escrow                       | Tell the seller that fulfilment may begin under the agreed terms                   |
| Delivered | Seller has submitted the contract-supported delivery action  | Show delivery information and buyer review action                                  |
| Released  | Funds were confirmed released to the seller                  | Show terminal settlement details and transaction reference                         |
| Refunded  | Funds were confirmed returned to the defined destination     | Show terminal refund details and transaction reference                             |
| Disputed  | An approved dispute path has paused ordinary resolution      | Explain the process, responsible party, and deadline; future only                  |
| Cancelled | Agreement ended before settlement under permitted conditions | Explain whether funds were ever committed and distinguish cancellation from refund |

Rules:

- Show timestamps only when sourced from authoritative data.
- Distinguish current, completed, skipped, unavailable, and terminal states.
- Never mark **Funded**, **Released**, or **Refunded** based only on wallet approval or transaction submission.
- Do not show **Released** after **Refunded** or **Cancelled**.
- Preserve the full event history even when the summary timeline is simplified.

## 9. Mobile navigation

- Use a compact top bar for brand, connection status, and contextual actions.
- Use a bottom navigation for Dashboard, Escrows, Create, and Activity when those destinations are active in the MVP.
- Place Settings and lower-frequency destinations in an accessible menu.
- Keep Create visually distinct without turning it into an oversized floating crypto-style action.
- Preserve labels with icons; do not rely on icons alone.
- Respect device safe areas and on-screen keyboards.
- Do not obscure primary content or confirmation controls.
- Maintain the same destination names and information hierarchy as desktop.

## 10. Desktop navigation

- Use a persistent application sidebar or stable application header, selected during implementation testing.
- Keep Dashboard, Escrows, Create Escrow, Activity, and Settings in a predictable order.
- Separate application navigation from wallet and account controls.
- Show the active destination through text and more than colour alone.
- Allow the content area to use the 1200px standard or 1440px operational container.
- Do not combine public marketing navigation with the signed-in application shell.

## 11. Breadcrumb rules

- Use breadcrumbs on hierarchical application screens, especially Escrow Details.
- Begin application breadcrumbs with the closest useful collection, not “Home.”
- Example: `Escrows / Agreement AP-…`.
- Do not show breadcrumbs on Dashboard or on shallow screens where they duplicate the title.
- Use the agreement title when safe and concise; otherwise use a shortened identifier.
- The current page is text, not an active link.
- On mobile, collapse only ancestors that remain recoverable through navigation.
- Breadcrumbs must reflect product hierarchy, not browser history.

## 12. Notification system

Notifications communicate meaningful changes requiring awareness or action.

Categories:

- **Action required:** funding, delivery, review, network correction, or future dispute response.
- **Transaction update:** submitted, confirmed, failed, or replaced.
- **Agreement update:** created, funded, delivered, released, refunded, cancelled, or future disputed.
- **System notice:** supported-network interruption or relevant maintenance.

Rules:

- Use in-app notifications as the initial source of truth.
- Do not promise email, push, or marketplace callbacks until implemented and consented.
- Deduplicate repeated network and indexing events.
- Include agreement context, timestamp, state, and a safe destination.
- Marking a notification read does not acknowledge a contract action.
- Never place seed phrases, full sensitive context, or deceptive wallet links in a notification.

## 13. Success messages

Success messages confirm an authoritative completed result.

Structure:

1. Completed action: “Agreement created.”
2. Result: “Agreement AP-… is confirmed.”
3. Relevant financial or state context.
4. One useful next action.
5. Real transaction reference when available.

Do not use celebration to obscure consequences. Avoid “Funds released” until network and contract state confirm release.

## 14. Error messages

Error messages state what failed, what remains safe, and what the user can do.

Structure:

1. Specific event: “Funding could not be confirmed.”
2. Current state: “Your agreement remains created and unfunded.”
3. Likely category when known: wallet rejection, network issue, validation, insufficient balance, contract rejection, or indexing delay.
4. Safe recovery action.
5. Support reference when useful.

Do not expose stack traces, blame the user, claim funds are lost without evidence, or reduce every failure to “Something went wrong.”

## 15. Confirmation dialogs

Use confirmation dialogs only for consequential, destructive, or irreversible actions. Routine navigation and low-risk edits do not require confirmation.

A financial confirmation includes:

- Action name
- Agreement identifier
- Amount and asset
- Source and destination roles
- Supported network
- Resulting agreement state
- Fee information when real and available
- Reversibility statement
- Explicit action label

Do not preselect acknowledgement checkboxes. Never place two visually equal primary actions in a consequential dialog. Closing a dialog must not submit an action.

## 16. Empty states

Required variants:

- Wallet not connected
- New account with no agreements
- No agreements in the selected role
- No activity
- No search results
- No results under active filters
- Data temporarily unavailable

Each state includes a precise heading, brief explanation, and at most one primary action. Clear-filter actions are preferred over Create Escrow when filters caused the empty result.

## 17. Search behaviour

- Search My Escrows by exact or partial agreement identifier, safe title text, external reference, or wallet address where supported.
- Trim whitespace and normalize address case for matching without altering displayed authoritative values.
- Begin client filtering immediately only for already-loaded small datasets.
- Debounce remote search and expose its loading state.
- Do not search descriptions or private contextual notes by default.
- Preserve the query in the URL when safe so results can be revisited.
- Provide a clear control and announce result-count changes accessibly.
- Never infer party identity from an address search.

## 18. Filtering

Supported escrow filters:

- User role: buyer or seller
- Agreement state
- Action required
- Asset
- Created date range
- Deadline range
- Marketplace source when a real integration exists

Supported activity filters:

- Event type
- Transaction state
- Agreement
- Date range

Rules:

- Default to all relevant records without hiding terminal states unexpectedly.
- Display active filters visibly and offer **Clear all**.
- Persist filters in the URL when they contain no sensitive information.
- Define multi-select behaviour consistently.
- Show result count after filters apply.

## 19. Sorting

Default escrow sort is **Action required first**, then most recently updated. Other supported sorts:

- Recently updated
- Newly created
- Deadline soonest
- Amount low to high
- Amount high to low, only within one asset or a transparent valuation context
- Agreement status

Activity defaults to newest event first. Sorting must be stable, state its direction, work by keyboard, and avoid misleading cross-asset amount comparisons.

## 20. Accessibility notes

- Target WCAG 2.2 AA.
- Use semantic landmarks, headings, lists, forms, tables, and dialogs.
- Maintain a logical focus order and visible focus treatment.
- Move focus to a useful heading after route navigation.
- On validation failure, focus the error summary and link errors to fields.
- Announce wallet, network, transaction, and agreement-state changes through appropriate live regions without repeated noise.
- Do not use colour, position, or icons as the only state indicator.
- Maintain at least 4.5:1 text contrast and 3:1 meaningful graphical contrast.
- Support keyboard completion of every non-wallet interaction.
- Make copy controls announce what was copied without exposing unnecessary full values.
- Provide 44×44px touch targets where practical.
- Support 200% text resizing and layouts down to 320px.
- Respect reduced motion, high contrast, zoom, and screen-reader preferences.
- Give dialogs names, descriptions, safe initial focus, focus containment, and return focus.
- Use real buttons and links according to behaviour.
- Provide accessible alternatives and summaries for future charts.
- Avoid time limits; where contract deadlines exist, present absolute time, timezone, and remaining duration.

## MVP Screen Priority

Priority reflects the standalone single-payment escrow MVP, not long-term strategic value.

### High

1. **Escrow Details** — central source of agreement truth and role-based action.
2. **Create Escrow** — required to originate the buyer-led transaction.
3. **My Escrows** — required for buyers and sellers to retrieve their agreements.
4. **Dashboard** — prioritizes obligations and gives users a reliable application entry point.
5. **Loading states** — essential for wallet and network uncertainty.
6. **Empty states** — essential for first use, disconnected accounts, and no-result conditions.
7. **404** — prevents unsafe dead ends and ambiguous invalid agreement routes.

### Medium

8. **Transaction Activity** — improves traceability beyond the agreement-level history.
9. **Landing** — important for explanation and trust, but separate from the core transaction engine.
10. **Settings** — useful for connection and preference management; initial scope should remain minimal.

### Low

11. **About** — valuable public context that can initially live in documentation.
12. **Documentation portal** — required documentation can initially exist in the repository before a dedicated screen.
13. **Marketplace integration entry and return screens** — deferred until a real integration is approved.
14. **Dispute submission and resolution screens** — deferred until a complete contract and resolution model exists.
15. **Administrator screens** — future-only and excluded from the first MVP.
