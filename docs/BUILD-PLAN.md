# AccordPay Build Plan

## Phase 1: Foundation

Define the product boundaries, technical architecture, repository conventions, supported GIWA environment, asset strategy, agreement state model, and security assumptions.

**Acceptance criteria**

- MVP requirements and exclusions are documented.
- Architecture and agreement lifecycle are reviewed.
- Network, wallet, asset, and tooling decisions are recorded.
- Local setup and contribution conventions are reproducible.
- No production-readiness or audit claims are made.

## Phase 2: Brand and UI system

Create AccordPay's independent visual language, design tokens, typography, spacing, interaction states, content style, and accessible component specifications.

**Acceptance criteria**

- Core tokens and component states are documented.
- Key screens have reviewed desktop and mobile designs.
- Contrast, focus, keyboard, error, loading, and empty states are specified.
- The system is recognizably AccordPay and does not imitate GIWA's identity.

## Phase 3: Frontend

Build the public introduction, wallet connection, agreement creation, review, funding, detail, delivery, release, refund, and dashboard experiences.

**Acceptance criteria**

- Buyer and seller can navigate the complete MVP journey.
- Wallet, network, transaction, loading, success, and failure states are clear.
- Forms validate inputs before contract interaction.
- Layouts work across supported mobile and desktop widths.
- Accessibility checks cover semantic structure, keyboard use, focus, and screen-reader labels.

## Phase 4: Smart contracts

Implement the smallest contract system required for single-payment escrow, including agreement creation, funding, delivery marking, release, eligible cancellation or refund, authorization, events, and fee handling.

**Acceptance criteria**

- State transitions and permissions match the documented lifecycle.
- Funds cannot be released or refunded twice.
- Unauthorized actions and invalid inputs revert predictably.
- Events expose the data needed by the interface and indexing strategy.
- Automated tests cover normal, boundary, and adversarial paths.
- Security assumptions and known limitations are documented without claiming an audit.

## Phase 5: GIWA integration

Connect contracts and the interface to the selected GIWA environment, including chain configuration, wallet switching, transaction submission, confirmations, and explorer references where officially available.

**Acceptance criteria**

- Supported GIWA network configuration is sourced from verified documentation.
- The interface detects and handles unsupported networks.
- A complete escrow flow succeeds on the selected GIWA environment.
- Contract addresses and deployment metadata are generated from real deployments, never placeholders.
- Failed, rejected, replaced, and delayed transactions have usable states.

## Phase 6: Testing

Validate contracts, frontend behavior, integrations, accessibility, responsiveness, and the end-to-end buyer and seller journey.

**Acceptance criteria**

- Contract unit and integration suites pass.
- Critical frontend flows have automated coverage.
- End-to-end tests cover creation through settlement and eligible refund.
- Manual tests cover supported browsers, wallets, and viewport sizes.
- Accessibility checks find no unresolved critical issues.
- A threat review records findings, owners, and dispositions.

## Phase 7: Deployment

Prepare deterministic contract deployment, environment configuration, frontend hosting, monitoring, rollback guidance, and release controls.

**Acceptance criteria**

- Deployment commands are reproducible from a clean environment.
- Secrets are excluded from version control.
- Network-specific configuration is validated before release.
- Deployed frontend and contracts complete the smoke-test flow.
- Rollback, pause, or incident procedures reflect the implemented contract design.

## Phase 8: Documentation

Document architecture, setup, environment variables, contracts, user flows, deployment, security limitations, and contributor workflows.

**Acceptance criteria**

- A new contributor can run and test the project from the documentation.
- Contract interfaces and state transitions are explained.
- User-facing guidance covers wallet safety and irreversible actions.
- Deployed configuration is clearly separated from examples.
- Claims accurately reflect the project's current maturity.

## Phase 9: Demo and submission

Prepare a concise narrative and reliable demonstration of the problem, agreement flow, GIWA usage, technical choices, and MVP limitations.

**Acceptance criteria**

- The demo completes the buyer and seller flow using real test deployment data.
- Reset and fallback procedures are documented.
- Submission materials contain no fake metrics, integrations, addresses, or audit claims.
- Repository, deployment, documentation, and presentation are mutually consistent.
- A final release checklist is completed and recorded.
