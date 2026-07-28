import { getAddress, isAddress, ZeroAddress } from "ethers";
import { ethers, network, run } from "hardhat";

async function main() {
  if (network.name !== "giwaSepolia") {
    throw new Error("Verification is supported only on giwaSepolia");
  }

  const contractValue = process.env.CONTRACT_ADDRESS;
  const resolverValue = process.env.DISPUTE_RESOLVER;
  if (!contractValue || !isAddress(contractValue)) {
    throw new Error("CONTRACT_ADDRESS must be a valid address");
  }
  if (!resolverValue || !isAddress(resolverValue)) {
    throw new Error("DISPUTE_RESOLVER must be a valid address");
  }

  const contractAddress = getAddress(contractValue);
  const resolver = getAddress(resolverValue);
  if (contractAddress === ZeroAddress || resolver === ZeroAddress) {
    throw new Error("Verification addresses cannot be zero");
  }

  const [deployer] = await ethers.getSigners();
  await run("verify:verify", {
    address: contractAddress,
    constructorArguments: [await deployer.getAddress(), resolver],
  });
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
