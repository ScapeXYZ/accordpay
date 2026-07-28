# AccordPay Dependency Security

## Scope and result

The dependency review uses `npm audit --json`. No forced audit remediation was used. The initial report contained 47 findings: 15 low, 7 moderate, and 25 high.

The safe non-breaking upgrade from `ethers` 6.16.0 to 6.17.0 removed the direct ethers advisory path. The post-upgrade report contains 45 findings: 15 low, 6 moderate, and 24 high.

These findings do not make the Solidity bytecode vulnerable by themselves. Most are build, test, lint, or local-development tool paths. They still matter because compromised tooling can affect developers and build integrity.

## Direct dependencies implicated

| Direct package                             | Installed | Type                             | Runtime exposure                                                | Highest advisory                                  | Safe non-breaking upgrade                                       | Required or deferred action                                                                           |
| ------------------------------------------ | --------- | -------------------------------- | --------------------------------------------------------------- | ------------------------------------------------- | --------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `ethers`                                   | 6.17.0    | Contract dev dependency          | Not bundled into the current frontend and not deployed on-chain | Previous moderate `ws` path                       | Applied                                                         | Keep pinned and monitor                                                                               |
| `hardhat`                                  | 2.28.6    | Root and contract dev dependency | Local compile, test, deployment, and RPC tooling only           | High through transitive tooling                   | No audit-proposed safe compatible fix                           | Defer until Hardhat 3 and coverage/plugin compatibility are validated                                 |
| `@nomicfoundation/hardhat-network-helpers` | 1.1.2     | Contract dev dependency          | Test process only                                               | Low through legacy Ethereum utilities             | Only major 3.x                                                  | Defer with Hardhat 3 migration                                                                        |
| `@nomicfoundation/hardhat-verify`          | 2.1.3     | Contract dev dependency          | Manual verification process only; not run in this phase         | Moderate/high transitive HTTP tooling             | Only major 3.x                                                  | Defer with Hardhat 3 migration; do not verify from untrusted networks                                 |
| `solidity-coverage`                        | 0.8.17    | Contract dev dependency          | Test instrumentation only                                       | High through legacy CLI/file tooling              | Audit recommendation is not a valid newer compatible resolution | Keep isolated to trusted source trees; reevaluate replacement or upstream fixes                       |
| `mocha`                                    | 11.7.5    | Contract dev dependency          | Test runner only                                                | High transitive glob/serialization paths          | No audit-clearing compatible release identified                 | Do not process untrusted test definitions or serialized input; monitor                                |
| `eslint`                                   | 9.39.2    | Root dev dependency              | Static analysis only                                            | High through minimatch family                     | Audit suggests major 10.x                                       | Defer until Next.js lint compatibility is verified                                                    |
| `eslint-config-next`                       | 16.2.12   | Web dev dependency               | Static analysis only                                            | High through ESLint plugins                       | Audit suggests an invalid downgrade, not a safe fix             | Keep aligned with Next.js and monitor upstream                                                        |
| `next`                                     | 16.2.12   | Web production dependency        | Deployed frontend runtime/build                                 | High through `postcss` and optional `sharp` paths | Audit suggests an invalid major downgrade                       | Highest-priority upstream watch; assess the next patched compatible Next.js release before deployment |

## Important transitive paths

- `next → postcss`: source-map parsing advisories may be reachable during CSS build processing if attacker-controlled CSS is introduced. AccordPay source CSS is repository-controlled.
- `next → sharp`: image-processing advisory path. AccordPay currently uses no untrusted image-processing endpoint, but deployed build/runtime exposure must be reevaluated with future image features.
- `eslint` and plugins → `minimatch` / `brace-expansion`: denial-of-service risk applies to developer-supplied patterns and repository paths, not contract bytecode.
- `hardhat` → `undici`, `adm-zip`, `uuid`, `solc`, and legacy ethers packages`: local development or verification paths. Avoid untrusted RPC, archive, and verification inputs.
- `solidity-coverage` → `glob`, `shelljs`, `web3-utils`, and related packages: local coverage process only.

## Reachability conclusions

- **Deployed Solidity:** None of the npm packages are embedded in EVM bytecode. Solidity imports are compiled source, and deployed behavior remains governed by the reviewed contract.
- **Current frontend:** Next.js is production-reachable. The reported `postcss` and `sharp` paths require continued attention before deployment even though current content is repository-controlled and no image-upload pipeline exists.
- **Developer and CI systems:** Hardhat, Mocha, coverage, ESLint, Solhint, and verification tooling are reachable during trusted local or CI commands. They must not process untrusted repositories, configuration, archives, RPC endpoints, or test files.

## Required actions before production

- Re-run `npm audit --json` immediately before any release.
- Upgrade Next.js and aligned lint packages when a compatible patched release resolves the reported paths.
- Plan and test a Hardhat 3 migration once coverage and verification plugins are compatible.
- Run CI tooling only against reviewed repository content and pinned lockfiles.
- Use a trusted RPC provider and explorer endpoint.
- Add dependency scanning to CI with documented exception review rather than automatic forced upgrades.
- Never use `npm audit fix --force` without an explicit migration and validation plan.
