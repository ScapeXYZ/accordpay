import assert from "node:assert/strict";

import { ethers, network } from "hardhat";

const amount = ethers.parseEther("1");

async function main() {
  if (network.name !== "hardhat") {
    throw new Error("Dry run is restricted to the ephemeral Hardhat network");
  }

  const [owner, buyer, seller, resolver] = await ethers.getSigners();
  const factory = await ethers.getContractFactory("AccordPayEscrow");
  const contract: any = await factory.deploy(owner.address, resolver.address);
  const deployment = contract.deploymentTransaction();
  await contract.waitForDeployment();

  assert.equal(await contract.owner(), owner.address);
  assert.equal(await contract.resolver(), resolver.address);
  console.log("Network:", network.name);
  console.log("Contract:", await contract.getAddress());
  console.log("Deployment transaction:", deployment?.hash);
  console.log("Owner confirmed:", owner.address);
  console.log("Resolver confirmed:", resolver.address);

  const latest = (await ethers.provider.getBlock("latest"))?.timestamp;
  if (!latest) throw new Error("Latest block timestamp unavailable");
  const deadline = latest + 3_600;

  await contract
    .connect(buyer)
    .createEscrow(seller.address, deadline, "ipfs://dry-run-release", {
      value: amount,
    });
  await contract.connect(seller).markDelivered(1, "ipfs://dry-run-delivery");
  await contract.connect(buyer).releaseFunds(1);
  console.log("Escrow 1: created, delivered, and released");

  await contract
    .connect(buyer)
    .createEscrow(seller.address, deadline, "ipfs://dry-run-refund", {
      value: amount,
    });
  await contract.connect(seller).approveRefund(2);
  console.log("Escrow 2: created and seller-refunded");

  await contract
    .connect(buyer)
    .createEscrow(seller.address, deadline, "ipfs://dry-run-dispute", {
      value: amount,
    });
  await contract.connect(buyer).raiseDispute(3);
  await contract.connect(resolver).resolveDispute(3, 4_000);
  console.log("Escrow 3: created, disputed, and resolved 40/60");

  const liability = await contract.totalLiability();
  const balance = await ethers.provider.getBalance(await contract.getAddress());
  assert.equal(liability, 0n);
  assert.equal(balance, 0n);
  console.log("Total escrows:", (await contract.totalEscrows()).toString());
  console.log("Final liability:", liability.toString());
  console.log("Final contract balance:", balance.toString());
  console.log("Dry run result: PASS");
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
