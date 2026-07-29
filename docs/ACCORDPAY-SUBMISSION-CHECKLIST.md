# AccordPay GASOK Submission Checklist

## Core submission

- [x] Live demo URL confirmed: [https://accordpay-giwa.vercel.app](https://accordpay-giwa.vercel.app)
- [ ] GitHub repository URL supplied and repository visibility confirmed
- [x] Deployed contract recorded: `0x0d6e2c12BD5916B1020A03f30EAf3b73f09dF798`
- [x] Verified GIWA Explorer link recorded: [AccordPayEscrow](https://sepolia-explorer.giwa.io/address/0x0d6e2c12BD5916B1020A03f30EAf3b73f09dF798)
- [x] Technical design document prepared: `docs/ACCORDPAY-TECHNICAL-DESIGN.md`
- [x] One-pager prepared: `docs/ACCORDPAY-ONE-PAGER.md`
- [x] Demo script prepared: `docs/ACCORDPAY-DEMO-SCRIPT.md`
- [ ] 60–90 second demo video recorded
- [ ] Demo video uploaded and share permissions tested
- [ ] Pitch deck prepared
- [ ] Pitch deck link or upload tested
- [ ] Final GASOK form completed
- [ ] Final GASOK form submitted
- [ ] Submission confirmation captured

## Required screenshots

- [ ] Production landing page with AccordPay identity and GIWA disclosure
- [ ] Wallet selector with a genuinely detected provider
- [ ] Connected wallet with confirmed UP ID and canonical address
- [ ] Separate Dojang verification state
- [ ] Create Escrow review before signature
- [ ] Confirmed escrow ID and transaction hash
- [ ] Live Escrow Details in Funded state
- [ ] Seller delivery action or Delivered state
- [ ] Buyer release action or Completed state
- [ ] Notification panel with real contract events
- [ ] Verified contract page on GIWA Explorer
- [ ] Confirmed lifecycle transaction on GIWA Explorer
- [ ] Responsive mobile application view

## Technical verification

- [ ] Production homepage returns HTTP 200
- [ ] `/app` returns HTTP 200
- [ ] `/app/create` returns HTTP 200
- [ ] `/app/agreements` returns HTTP 200
- [ ] Wallet connects on GIWA Sepolia
- [ ] Wrong-network handling works
- [ ] UP ID forward and reverse ownership agree for the demo wallet
- [ ] Dojang status is read successfully
- [ ] Buyer can create and atomically fund a fresh test escrow
- [ ] `EscrowCreated` produces the displayed numeric ID
- [ ] Seller can mark delivery
- [ ] Buyer can release funds
- [ ] Completed state refreshes after one confirmation
- [ ] Notification events appear for the connected participant
- [ ] Agreement and transaction explorer links open correctly
- [ ] Test ETH and unaudited-contract disclosures remain visible

## Repository validation

- [ ] `npm install` succeeds from a clean checkout
- [ ] `npm run build` passes
- [ ] `npm run lint` passes
- [ ] `npm run typecheck` passes
- [ ] `npm run format:check` passes
- [ ] `npm run test:names` passes
- [ ] `npm run test:verification` passes
- [ ] `npm run test:notifications` passes
- [ ] `npm run contracts:test` passes
- [ ] No private key or `.env` file is tracked
- [ ] Exported ABI matches the verified deployment
- [ ] Deployment address, block, chain ID, and explorer link are consistent
- [ ] Git status contains only intended submission changes

## Content and claims review

- [ ] No fabricated users, metrics, transaction volume, revenue, or testimonials
- [ ] No unsupported partnership claim
- [ ] No claim that the contract is independently audited
- [ ] Explorer source verification is not described as a security audit
- [ ] GIWA Sepolia is consistently labelled as a testnet
- [ ] Test ETH is consistently described as having no monetary value
- [ ] AccordPay is described as an independent product built on GIWA
- [ ] Future marketplace modules are clearly marked as not implemented
- [ ] Dispute resolution is not called decentralized arbitration
- [ ] Wallet address remains the canonical identity

## Manual information still required

- GitHub repository URL
- GASOK submission form URL and deadline
- Submitter or team display name
- Contact email or required social profile
- Demo video URL
- Pitch deck URL
- Screenshot asset locations
- Any required team biography
- Any required license selection or repository visibility setting
- Final submission confirmation or reference number
