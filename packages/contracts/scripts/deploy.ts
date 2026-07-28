import { getAddress, isAddress, ZeroAddress } from "ethers";
import { ethers, network } from "hardhat";

const supported = new Set(["hardhat", "localhost", "giwaSepolia"]);

async function main() {
  if (!supported.has(network.name)) {
    throw new Error(`Unsupported deployment network: ${network.name}`);
  }

  const resolverValue = process.env.DISPUTE_RESOLVER;
  if (!resolverValue || !isAddress(resolverValue)) {
    throw new Error("DISPUTE_RESOLVER must be a valid non-zero address");
  }
  const resolver = getAddress(resolverValue);
  if (resolver === ZeroAddress)
    throw new Error("DISPUTE_RESOLVER cannot be zero");

  const [deployer] = await ethers.getSigners();
  const owner = await deployer.getAddress();
  const factory = await ethers.getContractFactory("AccordPayEscrow");
  const contract = await factory.deploy(owner, resolver);
  const deploymentTransaction = contract.deploymentTransaction();
  if (!deploymentTransaction)
    throw new Error("Deployment transaction unavailable");
  await contract.waitForDeployment();
  const receipt = await deploymentTransaction.wait();
  if (!receipt) throw new Error("Deployment receipt unavailable");

  const providerNetwork = await ethers.provider.getNetwork();
  const deploymentCost = receipt.gasUsed * receipt.gasPrice;
  const block = await ethers.provider.getBlock(receipt.blockNumber);
  console.log("Network:", network.name);
  console.log("Chain ID:", providerNetwork.chainId.toString());
  console.log("Deployer:", owner);
  console.log("Resolver:", resolver);
  console.log("Contract address:", await contract.getAddress());
  console.log("Deployment transaction hash:", deploymentTransaction.hash);
  console.log("Block number:", receipt.blockNumber.toString());
  console.log("Gas used:", receipt.gasUsed.toString());
  console.log("Effective gas price:", receipt.gasPrice.toString());
  console.log("Deployment cost:", deploymentCost.toString());
  console.log(
    "Deployment timestamp:",
    block?.timestamp.toString() ?? "unavailable",
  );
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
