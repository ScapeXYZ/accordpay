# GIWA Sepolia Deployment Checklist

This checklist is intentionally unchecked. Completing repository validation does not authorise deployment. Test ETH has no monetary value, the contract is unaudited, and production use is prohibited.

## Security and build

- [ ] Security review completed
- [ ] All tests passed
- [ ] Branch coverage target achieved
- [ ] Contract bytecode size checked
- [ ] Compiler version locked
- [ ] Optimizer settings documented
- [ ] Independent Slither analysis completed
- [ ] Independent professional audit completed or contract remains clearly labelled unaudited

## Roles and environment

- [ ] Deployer wallet created
- [ ] Deployer wallet contains only test ETH
- [ ] Resolver address confirmed
- [ ] Owner address confirmed
- [ ] Production owner and resolver custody model reviewed
- [ ] Environment file configured locally
- [ ] No private key committed
- [ ] GIWA RPC reachable
- [ ] Chain ID confirmed as `91342`

## Dry run and deployment

- [ ] Deployment dry run completed
- [ ] Constructor arguments recorded
- [ ] Deployment transaction recorded
- [ ] Contract address recorded
- [ ] Deployment receipt and chain ID independently confirmed

## Verification and smoke test

- [ ] Source verification completed
- [ ] Explorer link tested
- [ ] Verified source and constructor arguments inspected
- [ ] Basic live escrow smoke test completed with Test ETH only
- [ ] Final liability and contract balance checked

## Integration and disclosure

- [ ] Frontend ABI and address updated only after verification
- [ ] Frontend configured for GIWA Sepolia only
- [ ] Contract still labelled unaudited
- [ ] GIWA Sepolia testnet disclosure visible
- [ ] Test ETH no-value disclosure visible
- [ ] Production use prohibited
