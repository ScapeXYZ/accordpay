import {
  accordPayEscrowAbi,
  accordPayEscrowDeployment,
} from "../../../../packages/shared/src/contracts";

/**
 * Read-only deployed contract configuration.
 *
 * Wallet connections and contract write interactions remain intentionally disabled.
 */
export const accordPayEscrowContract = {
  ...accordPayEscrowDeployment,
  abi: accordPayEscrowAbi,
} as const;
