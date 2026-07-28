import assert from "node:assert/strict";

import { loadFixture, time } from "@nomicfoundation/hardhat-network-helpers";
import { ethers } from "hardhat";

const AMOUNT = ethers.parseEther("1");
const META = "ipfs://agreement-cid";
const DELIVERY = "ipfs://delivery-cid";

async function expectRevert(action: Promise<unknown>, fragment: string) {
  await assert.rejects(action, (error: Error) =>
    error.message.includes(fragment),
  );
}

async function deployFixture() {
  const [owner, buyer, seller, resolver, stranger, nextOwner] =
    await ethers.getSigners();
  const factory = await ethers.getContractFactory("AccordPayEscrow");
  const escrow: any = await factory.deploy(owner.address, resolver.address);
  await escrow.waitForDeployment();
  return { escrow, owner, buyer, seller, resolver, stranger, nextOwner };
}

async function createFunded() {
  const fixture = await loadFixture(deployFixture);
  const deadline = (await time.latest()) + 3_600;
  await fixture.escrow
    .connect(fixture.buyer)
    .createEscrow(fixture.seller.address, deadline, META, { value: AMOUNT });
  return { ...fixture, deadline, escrowId: 1n };
}

async function createDelivered() {
  const fixture = await createFunded();
  await fixture.escrow
    .connect(fixture.seller)
    .markDelivered(fixture.escrowId, DELIVERY);
  return fixture;
}

describe("AccordPayEscrow", function () {
  describe("creation", function () {
    it("atomically creates and funds an escrow", async function () {
      const { escrow, buyer, seller } = await loadFixture(deployFixture);
      const deadline = (await time.latest()) + 3_600;
      await escrow
        .connect(buyer)
        .createEscrow(seller.address, deadline, META, { value: AMOUNT });
      assert.equal(
        await ethers.provider.getBalance(await escrow.getAddress()),
        AMOUNT,
      );
      assert.equal(await escrow.totalEscrows(), 1n);
    });

    it("rejects zero payment", async function () {
      const { escrow, buyer, seller } = await loadFixture(deployFixture);
      await expectRevert(
        escrow
          .connect(buyer)
          .createEscrow(seller.address, (await time.latest()) + 100, META),
        "InvalidAmount",
      );
    });

    it("rejects the zero seller", async function () {
      const { escrow, buyer } = await loadFixture(deployFixture);
      await expectRevert(
        escrow
          .connect(buyer)
          .createEscrow(ethers.ZeroAddress, (await time.latest()) + 100, META, {
            value: AMOUNT,
          }),
        "ZeroAddress",
      );
    });

    it("rejects a buyer acting as seller", async function () {
      const { escrow, buyer } = await loadFixture(deployFixture);
      await expectRevert(
        escrow
          .connect(buyer)
          .createEscrow(buyer.address, (await time.latest()) + 100, META, {
            value: AMOUNT,
          }),
        "InvalidSeller",
      );
    });

    it("rejects an expired deadline", async function () {
      const { escrow, buyer, seller } = await loadFixture(deployFixture);
      await expectRevert(
        escrow
          .connect(buyer)
          .createEscrow(seller.address, await time.latest(), META, {
            value: AMOUNT,
          }),
        "InvalidDeadline",
      );
    });

    it("rejects an empty metadata reference", async function () {
      const { escrow, buyer, seller } = await loadFixture(deployFixture);
      await expectRevert(
        escrow
          .connect(buyer)
          .createEscrow(seller.address, (await time.latest()) + 100, "", {
            value: AMOUNT,
          }),
        "EmptyMetadata",
      );
    });

    it("rejects an unusually long metadata reference", async function () {
      const { escrow, buyer, seller } = await loadFixture(deployFixture);
      await expectRevert(
        escrow
          .connect(buyer)
          .createEscrow(
            seller.address,
            (await time.latest()) + 100,
            "x".repeat(2_049),
            { value: AMOUNT },
          ),
        "MetadataTooLong",
      );
    });

    it("accepts a metadata reference at the maximum length", async function () {
      const { escrow, buyer, seller } = await loadFixture(deployFixture);
      await escrow
        .connect(buyer)
        .createEscrow(
          seller.address,
          (await time.latest()) + 100,
          "x".repeat(2_048),
          { value: AMOUNT },
        );
      assert.equal(await escrow.totalLiability(), AMOUNT);
    });

    it("rejects zero owner and resolver constructor arguments", async function () {
      const [owner, resolver] = await ethers.getSigners();
      const factory = await ethers.getContractFactory("AccordPayEscrow");
      await expectRevert(
        factory.deploy(ethers.ZeroAddress, resolver.address),
        "OwnableInvalidOwner",
      );
      await expectRevert(
        factory.deploy(owner.address, ethers.ZeroAddress),
        "ZeroAddress",
      );
    });

    it("assigns sequential IDs and stores exact data", async function () {
      const { escrow, buyer, seller } = await loadFixture(deployFixture);
      const deadline = (await time.latest()) + 3_600;
      await escrow
        .connect(buyer)
        .createEscrow(seller.address, deadline, META, { value: AMOUNT });
      await escrow
        .connect(buyer)
        .createEscrow(seller.address, deadline + 1, `${META}-2`, {
          value: 2n * AMOUNT,
        });
      const record = await escrow.getEscrow(2);
      assert.equal(record.id, 2n);
      assert.equal(record.buyer, buyer.address);
      assert.equal(record.seller, seller.address);
      assert.equal(record.amount, 2n * AMOUNT);
      assert.equal(record.deadline, BigInt(deadline + 1));
      assert.equal(record.status, 0n);
      assert.equal(record.metadataURI, `${META}-2`);
      assert.equal(record.deliveryURI, "");
      assert(record.createdAt > 0n);
      assert.equal(record.deliveredAt, 0n);
      assert.equal(record.completedAt, 0n);
    });

    it("emits EscrowCreated with indexed parties", async function () {
      const { escrow, buyer, seller } = await loadFixture(deployFixture);
      const deadline = (await time.latest()) + 3_600;
      const receipt = await (
        await escrow
          .connect(buyer)
          .createEscrow(seller.address, deadline, META, { value: AMOUNT })
      ).wait();
      const event = receipt?.logs
        .map((log: any) => {
          try {
            return escrow.interface.parseLog(log);
          } catch {
            return null;
          }
        })
        .find((log: any) => log?.name === "EscrowCreated");
      assert(event);
      assert.equal(event.args.escrowId, 1n);
      assert.equal(event.args.buyer, buyer.address);
      assert.equal(event.args.seller, seller.address);
      assert.equal(event.args.amount, AMOUNT);
    });
  });

  describe("delivery", function () {
    it("allows only the seller to mark delivery", async function () {
      const { escrow, seller, escrowId } = await loadFixture(createFunded);
      await escrow.connect(seller).markDelivered(escrowId, DELIVERY);
      const record = await escrow.getEscrow(escrowId);
      assert.equal(record.status, 1n);
      assert.equal(record.deliveryURI, DELIVERY);
      assert(record.deliveredAt > 0n);
    });

    for (const role of ["buyer", "stranger"] as const) {
      it(`rejects delivery by the ${role}`, async function () {
        const fixture = await loadFixture(createFunded);
        await expectRevert(
          fixture.escrow
            .connect(fixture[role])
            .markDelivered(fixture.escrowId, DELIVERY),
          "Unauthorized",
        );
      });
    }

    it("rejects empty delivery evidence", async function () {
      const { escrow, seller, escrowId } = await loadFixture(createFunded);
      await expectRevert(
        escrow.connect(seller).markDelivered(escrowId, ""),
        "EmptyMetadata",
      );
    });

    it("rejects an unusually long delivery reference", async function () {
      const { escrow, seller, escrowId } = await loadFixture(createFunded);
      await expectRevert(
        escrow.connect(seller).markDelivered(escrowId, "x".repeat(2_049)),
        "MetadataTooLong",
      );
    });

    it("cannot mark delivery twice", async function () {
      const { escrow, seller, escrowId } = await loadFixture(createDelivered);
      await expectRevert(
        escrow.connect(seller).markDelivered(escrowId, DELIVERY),
        "InvalidStatus",
      );
    });

    it("cannot mark delivery after refund", async function () {
      const { escrow, seller, escrowId } = await loadFixture(createFunded);
      await escrow.connect(seller).approveRefund(escrowId);
      await expectRevert(
        escrow.connect(seller).markDelivered(escrowId, DELIVERY),
        "InvalidStatus",
      );
    });

    it("cannot mark delivery after completion", async function () {
      const { escrow, buyer, seller, escrowId } =
        await loadFixture(createDelivered);
      await escrow.connect(buyer).releaseFunds(escrowId);
      await expectRevert(
        escrow.connect(seller).markDelivered(escrowId, DELIVERY),
        "InvalidStatus",
      );
    });
  });

  describe("release", function () {
    it("lets the buyer release the full amount after delivery", async function () {
      const { escrow, buyer, seller, escrowId } =
        await loadFixture(createDelivered);
      const before = await ethers.provider.getBalance(seller.address);
      await escrow.connect(buyer).releaseFunds(escrowId);
      assert.equal(
        await ethers.provider.getBalance(seller.address),
        before + AMOUNT,
      );
      assert.equal((await escrow.getEscrow(escrowId)).status, 2n);
    });

    for (const role of ["seller", "stranger"] as const) {
      it(`rejects release by the ${role}`, async function () {
        const fixture = await loadFixture(createDelivered);
        await expectRevert(
          fixture.escrow.connect(fixture[role]).releaseFunds(fixture.escrowId),
          "Unauthorized",
        );
      });
    }

    it("rejects release before delivery", async function () {
      const { escrow, buyer, escrowId } = await loadFixture(createFunded);
      await expectRevert(
        escrow.connect(buyer).releaseFunds(escrowId),
        "InvalidStatus",
      );
    });

    it("rejects repeated release", async function () {
      const { escrow, buyer, escrowId } = await loadFixture(createDelivered);
      await escrow.connect(buyer).releaseFunds(escrowId);
      await expectRevert(
        escrow.connect(buyer).releaseFunds(escrowId),
        "InvalidStatus",
      );
    });

    it("reduces the contract balance by the released amount", async function () {
      const { escrow, buyer, escrowId } = await loadFixture(createDelivered);
      await escrow.connect(buyer).releaseFunds(escrowId);
      assert.equal(
        await ethers.provider.getBalance(await escrow.getAddress()),
        0n,
      );
    });

    it("reverts atomically when the seller rejects payment", async function () {
      const { escrow, buyer } = await loadFixture(deployFixture);
      const rejector: any = await (
        await ethers.getContractFactory("RejectingReceiver")
      ).deploy(await escrow.getAddress());
      await rejector.waitForDeployment();
      const deadline = (await time.latest()) + 3_600;
      await escrow
        .connect(buyer)
        .createEscrow(await rejector.getAddress(), deadline, META, {
          value: AMOUNT,
        });
      await rejector.markDelivered(1, DELIVERY);
      await expectRevert(
        escrow.connect(buyer).releaseFunds(1),
        "TransferFailed",
      );
      assert.equal((await escrow.getEscrow(1)).status, 1n);
      assert.equal(
        await ethers.provider.getBalance(await escrow.getAddress()),
        AMOUNT,
      );
    });
  });

  describe("refunds", function () {
    it("allows a seller-approved refund while funded", async function () {
      const { escrow, buyer, seller, escrowId } =
        await loadFixture(createFunded);
      const before = await ethers.provider.getBalance(buyer.address);
      await escrow.connect(seller).approveRefund(escrowId);
      assert.equal(
        await ethers.provider.getBalance(buyer.address),
        before + AMOUNT,
      );
      assert.equal((await escrow.getEscrow(escrowId)).status, 3n);
    });

    it("allows a seller-approved refund after delivery as consensual unwind", async function () {
      const { escrow, seller, escrowId } = await loadFixture(createDelivered);
      await escrow.connect(seller).approveRefund(escrowId);
      assert.equal((await escrow.getEscrow(escrowId)).status, 3n);
    });

    it("rejects seller refund by buyer", async function () {
      const { escrow, buyer, escrowId } = await loadFixture(createFunded);
      await expectRevert(
        escrow.connect(buyer).approveRefund(escrowId),
        "Unauthorized",
      );
    });

    it("allows buyer reclaim after deadline while funded", async function () {
      const { escrow, buyer, deadline, escrowId } =
        await loadFixture(createFunded);
      await time.increaseTo(deadline + 1);
      await escrow.connect(buyer).reclaimAfterDeadline(escrowId);
      assert.equal((await escrow.getEscrow(escrowId)).status, 3n);
    });

    it("rejects reclaim before deadline", async function () {
      const { escrow, buyer, escrowId } = await loadFixture(createFunded);
      await expectRevert(
        escrow.connect(buyer).reclaimAfterDeadline(escrowId),
        "DeadlineNotReached",
      );
    });

    it("rejects reclaim in the block immediately before the deadline", async function () {
      const { escrow, buyer, deadline, escrowId } =
        await loadFixture(createFunded);
      await time.setNextBlockTimestamp(deadline - 1);
      await expectRevert(
        escrow.connect(buyer).reclaimAfterDeadline(escrowId),
        "DeadlineNotReached",
      );
    });

    it("rejects reclaim exactly at the deadline", async function () {
      const { escrow, buyer, deadline, escrowId } =
        await loadFixture(createFunded);
      await time.setNextBlockTimestamp(deadline);
      await expectRevert(
        escrow.connect(buyer).reclaimAfterDeadline(escrowId),
        "DeadlineNotReached",
      );
    });

    it("rejects reclaim after delivery", async function () {
      const { escrow, buyer, deadline, escrowId } =
        await loadFixture(createDelivered);
      await time.increaseTo(deadline + 1);
      await expectRevert(
        escrow.connect(buyer).reclaimAfterDeadline(escrowId),
        "InvalidStatus",
      );
    });

    it("rejects double refund", async function () {
      const { escrow, seller, escrowId } = await loadFixture(createFunded);
      await escrow.connect(seller).approveRefund(escrowId);
      await expectRevert(
        escrow.connect(seller).approveRefund(escrowId),
        "InvalidStatus",
      );
    });
  });

  describe("disputes", function () {
    for (const role of ["buyer", "seller"] as const) {
      it(`allows the ${role} to raise a dispute`, async function () {
        const fixture = await loadFixture(createFunded);
        await fixture.escrow
          .connect(fixture[role])
          .raiseDispute(fixture.escrowId);
        assert.equal(
          (await fixture.escrow.getEscrow(fixture.escrowId)).status,
          4n,
        );
      });
    }

    it("rejects dispute by a stranger", async function () {
      const { escrow, stranger, escrowId } = await loadFixture(createFunded);
      await expectRevert(
        escrow.connect(stranger).raiseDispute(escrowId),
        "Unauthorized",
      );
    });

    it("rejects disputes in terminal states", async function () {
      const { escrow, buyer, seller, escrowId } =
        await loadFixture(createFunded);
      await escrow.connect(seller).approveRefund(escrowId);
      await expectRevert(
        escrow.connect(buyer).raiseDispute(escrowId),
        "InvalidStatus",
      );
    });

    it("keeps funds locked when disputed", async function () {
      const { escrow, buyer, escrowId } = await loadFixture(createFunded);
      await escrow.connect(buyer).raiseDispute(escrowId);
      assert.equal(
        await ethers.provider.getBalance(await escrow.getAddress()),
        AMOUNT,
      );
    });

    it("allows only the resolver to resolve", async function () {
      const { escrow, buyer, stranger, escrowId } =
        await loadFixture(createFunded);
      await escrow.connect(buyer).raiseDispute(escrowId);
      await expectRevert(
        escrow.connect(stranger).resolveDispute(escrowId, 5_000),
        "Unauthorized",
      );
    });

    it("rejects a split above 10,000 basis points", async function () {
      const { escrow, buyer, resolver, escrowId } =
        await loadFixture(createFunded);
      await escrow.connect(buyer).raiseDispute(escrowId);
      await expectRevert(
        escrow.connect(resolver).resolveDispute(escrowId, 10_001),
        "InvalidBuyerShare",
      );
    });

    it("assigns odd-wei rounding remainder to the seller without dust", async function () {
      const { escrow, buyer, seller, resolver } =
        await loadFixture(deployFixture);
      const oddAmount = 10_001n;
      await escrow
        .connect(buyer)
        .createEscrow(seller.address, (await time.latest()) + 100, META, {
          value: oddAmount,
        });
      await escrow.connect(buyer).raiseDispute(1);
      const buyerBefore = await ethers.provider.getBalance(buyer.address);
      const sellerBefore = await ethers.provider.getBalance(seller.address);
      await escrow.connect(resolver).resolveDispute(1, 5_000);
      assert.equal(
        await ethers.provider.getBalance(buyer.address),
        buyerBefore + 5_000n,
      );
      assert.equal(
        await ethers.provider.getBalance(seller.address),
        sellerBefore + 5_001n,
      );
      assert.equal(await escrow.totalLiability(), 0n);
      assert.equal(
        await ethers.provider.getBalance(await escrow.getAddress()),
        0n,
      );
    });

    for (const [label, share] of [
      ["100% buyer", 10_000],
      ["100% seller", 0],
      ["split payout", 4_000],
    ] as const) {
      it(`resolves a ${label} award`, async function () {
        const { escrow, buyer, seller, resolver, escrowId } =
          await loadFixture(createFunded);
        await escrow.connect(buyer).raiseDispute(escrowId);
        const buyerBefore = await ethers.provider.getBalance(buyer.address);
        const sellerBefore = await ethers.provider.getBalance(seller.address);
        await escrow.connect(resolver).resolveDispute(escrowId, share);
        const buyerPayout = (AMOUNT * BigInt(share)) / 10_000n;
        assert.equal(
          await ethers.provider.getBalance(buyer.address),
          buyerBefore + buyerPayout,
        );
        assert.equal(
          await ethers.provider.getBalance(seller.address),
          sellerBefore + AMOUNT - buyerPayout,
        );
        assert.equal((await escrow.getEscrow(escrowId)).status, 2n);
      });
    }

    it("cannot resolve twice", async function () {
      const { escrow, buyer, resolver, escrowId } =
        await loadFixture(createFunded);
      await escrow.connect(buyer).raiseDispute(escrowId);
      await escrow.connect(resolver).resolveDispute(escrowId, 5_000);
      await expectRevert(
        escrow.connect(resolver).resolveDispute(escrowId, 5_000),
        "InvalidStatus",
      );
    });
  });

  describe("administration", function () {
    it("lets the owner update the resolver", async function () {
      const { escrow, owner, stranger } = await loadFixture(deployFixture);
      await escrow.connect(owner).setResolver(stranger.address);
      assert.equal(await escrow.resolver(), stranger.address);
    });

    it("rejects resolver updates by non-owner", async function () {
      const { escrow, stranger } = await loadFixture(deployFixture);
      await expectRevert(
        escrow.connect(stranger).setResolver(stranger.address),
        "OwnableUnauthorizedAccount",
      );
    });

    it("rejects a zero resolver", async function () {
      const { escrow, owner } = await loadFixture(deployFixture);
      await expectRevert(
        escrow.connect(owner).setResolver(ethers.ZeroAddress),
        "ZeroAddress",
      );
    });

    it("pauses and unpauses with explicit state", async function () {
      const { escrow, owner } = await loadFixture(deployFixture);
      await escrow.connect(owner).pause();
      assert.equal(await escrow.paused(), true);
      await escrow.connect(owner).unpause();
      assert.equal(await escrow.paused(), false);
    });

    it("rejects pause and unpause by non-owner", async function () {
      const { escrow, owner, stranger } = await loadFixture(deployFixture);
      await expectRevert(
        escrow.connect(stranger).pause(),
        "OwnableUnauthorizedAccount",
      );
      await escrow.connect(owner).pause();
      await expectRevert(
        escrow.connect(stranger).unpause(),
        "OwnableUnauthorizedAccount",
      );
    });

    it("blocks creation while paused", async function () {
      const { escrow, owner, buyer, seller } = await loadFixture(deployFixture);
      await escrow.connect(owner).pause();
      await expectRevert(
        escrow
          .connect(buyer)
          .createEscrow(seller.address, (await time.latest()) + 100, META, {
            value: AMOUNT,
          }),
        "EnforcedPause",
      );
    });

    it("allows delivery and dispute freeze while paused", async function () {
      const { escrow, owner, buyer, seller, escrowId } =
        await loadFixture(createFunded);
      await escrow.connect(owner).pause();
      await escrow.connect(seller).markDelivered(escrowId, DELIVERY);
      await escrow.connect(buyer).raiseDispute(escrowId);
      assert.equal((await escrow.getEscrow(escrowId)).status, 4n);
    });

    it("allows release while paused", async function () {
      const { escrow, owner, buyer, escrowId } =
        await loadFixture(createDelivered);
      await escrow.connect(owner).pause();
      await escrow.connect(buyer).releaseFunds(escrowId);
      assert.equal(await escrow.totalLiability(), 0n);
    });

    it("allows seller-approved refund while paused", async function () {
      const { escrow, owner, seller, escrowId } =
        await loadFixture(createFunded);
      await escrow.connect(owner).pause();
      await escrow.connect(seller).approveRefund(escrowId);
      assert.equal(await escrow.totalLiability(), 0n);
    });

    it("allows deadline reclaim while paused", async function () {
      const { escrow, owner, buyer, deadline, escrowId } =
        await loadFixture(createFunded);
      await escrow.connect(owner).pause();
      await time.increaseTo(deadline + 1);
      await escrow.connect(buyer).reclaimAfterDeadline(escrowId);
      assert.equal(await escrow.totalLiability(), 0n);
    });

    it("allows dispute resolution while paused", async function () {
      const { escrow, owner, buyer, resolver, escrowId } =
        await loadFixture(createFunded);
      await escrow.connect(buyer).raiseDispute(escrowId);
      await escrow.connect(owner).pause();
      await escrow.connect(resolver).resolveDispute(escrowId, 5_000);
      assert.equal(await escrow.totalLiability(), 0n);
    });

    it("uses two-step ownership transfer", async function () {
      const { escrow, owner, nextOwner } = await loadFixture(deployFixture);
      await escrow.connect(owner).transferOwnership(nextOwner.address);
      assert.equal(await escrow.owner(), owner.address);
      assert.equal(await escrow.pendingOwner(), nextOwner.address);
      await escrow.connect(nextOwner).acceptOwnership();
      assert.equal(await escrow.owner(), nextOwner.address);
    });

    it("rejects ownership acceptance by an address other than pending owner", async function () {
      const { escrow, owner, nextOwner, stranger } =
        await loadFixture(deployFixture);
      await escrow.connect(owner).transferOwnership(nextOwner.address);
      await expectRevert(
        escrow.connect(stranger).acceptOwnership(),
        "OwnableUnauthorizedAccount",
      );
    });

    it("uses a zero-address ownership transfer to cancel a pending transfer", async function () {
      const { escrow, owner, nextOwner } = await loadFixture(deployFixture);
      await escrow.connect(owner).transferOwnership(nextOwner.address);
      await escrow.connect(owner).transferOwnership(ethers.ZeroAddress);
      assert.equal(await escrow.pendingOwner(), ethers.ZeroAddress);
      assert.equal(await escrow.owner(), owner.address);
    });

    it("disables ownership renunciation", async function () {
      const { escrow, owner } = await loadFixture(deployFixture);
      await expectRevert(
        escrow.connect(owner).renounceOwnership(),
        "OwnershipRenunciationDisabled",
      );
      assert.equal(await escrow.owner(), owner.address);
    });

    it("rejects renunciation attempts by non-owner", async function () {
      const { escrow, stranger } = await loadFixture(deployFixture);
      await expectRevert(
        escrow.connect(stranger).renounceOwnership(),
        "OwnableUnauthorizedAccount",
      );
    });

    it("permits owner and resolver to be the same secured address", async function () {
      const [owner] = await ethers.getSigners();
      const factory = await ethers.getContractFactory("AccordPayEscrow");
      const escrow: any = await factory.deploy(owner.address, owner.address);
      await escrow.waitForDeployment();
      assert.equal(await escrow.owner(), owner.address);
      assert.equal(await escrow.resolver(), owner.address);
    });

    it("allows an idempotent resolver update without corrupting state", async function () {
      const { escrow, owner, resolver } = await loadFixture(deployFixture);
      await escrow.connect(owner).setResolver(resolver.address);
      assert.equal(await escrow.resolver(), resolver.address);
    });

    it("exposes no owner withdrawal selector", async function () {
      const names = (
        await ethers.getContractFactory("AccordPayEscrow")
      ).interface.fragments
        .filter((fragment) => fragment.type === "function")
        .map((fragment: any) => fragment.name);
      assert(!names.includes("withdraw"));
      assert(!names.includes("sweep"));
      assert(!names.includes("seize"));
    });
  });

  describe("security and terminality", function () {
    it("rejects direct native-asset transfers", async function () {
      const { escrow, buyer } = await loadFixture(deployFixture);
      await expectRevert(
        buyer.sendTransaction({ to: await escrow.getAddress(), value: 1n }),
        "UnexpectedEther",
      );
    });

    it("rejects calldata sent through fallback", async function () {
      const { escrow, buyer } = await loadFixture(deployFixture);
      await expectRevert(
        buyer.sendTransaction({
          to: await escrow.getAddress(),
          data: "0x12345678",
        }),
        "UnexpectedEther",
      );
    });

    it("rejects unknown escrow IDs", async function () {
      const { escrow } = await loadFixture(deployFixture);
      await expectRevert(escrow.getEscrow(999), "EscrowNotFound");
    });

    it("blocks seller reentrancy and preserves one payout", async function () {
      const { escrow, buyer } = await loadFixture(deployFixture);
      const attacker: any = await (
        await ethers.getContractFactory("ReentrantSeller")
      ).deploy(await escrow.getAddress());
      await attacker.waitForDeployment();
      await escrow
        .connect(buyer)
        .createEscrow(
          await attacker.getAddress(),
          (await time.latest()) + 3_600,
          META,
          { value: AMOUNT },
        );
      await attacker.markDelivered(1, DELIVERY);
      await escrow.connect(buyer).releaseFunds(1);
      assert.equal(await attacker.reentryAttempted(), true);
      assert.equal(await attacker.reentrySucceeded(), false);
      assert.equal(
        await ethers.provider.getBalance(await attacker.getAddress()),
        AMOUNT,
      );
      assert.equal((await escrow.getEscrow(1)).status, 2n);
    });

    it("blocks buyer reentrancy during a seller-approved refund", async function () {
      const { escrow, seller } = await loadFixture(deployFixture);
      const attacker: any = await (
        await ethers.getContractFactory("ReentrantBuyer")
      ).deploy(await escrow.getAddress());
      await attacker.waitForDeployment();
      await attacker.create(
        seller.address,
        (await time.latest()) + 3_600,
        META,
        { value: AMOUNT },
      );
      await escrow.connect(seller).approveRefund(1);
      assert.equal(await attacker.reentryAttempted(), true);
      assert.equal(await attacker.reentrySucceeded(), false);
      assert.equal(
        await ethers.provider.getBalance(await attacker.getAddress()),
        AMOUNT,
      );
      assert.equal((await escrow.getEscrow(1)).status, 3n);
    });

    it("rolls back a refund and liability when the buyer rejects ETH", async function () {
      const { escrow, seller } = await loadFixture(deployFixture);
      const rejector: any = await (
        await ethers.getContractFactory("RejectingReceiver")
      ).deploy(await escrow.getAddress());
      await rejector.waitForDeployment();
      await rejector.create(
        seller.address,
        (await time.latest()) + 3_600,
        META,
        { value: AMOUNT },
      );
      await expectRevert(
        escrow.connect(seller).approveRefund(1),
        "TransferFailed",
      );
      assert.equal((await escrow.getEscrow(1)).status, 0n);
      assert.equal(await escrow.totalLiability(), AMOUNT);
    });

    it("rolls back dispute resolution when the buyer rejects ETH", async function () {
      const { escrow, seller, resolver } = await loadFixture(deployFixture);
      const rejector: any = await (
        await ethers.getContractFactory("RejectingReceiver")
      ).deploy(await escrow.getAddress());
      await rejector.waitForDeployment();
      await rejector.create(
        seller.address,
        (await time.latest()) + 3_600,
        META,
        { value: AMOUNT },
      );
      await rejector.raiseDispute(1);
      await expectRevert(
        escrow.connect(resolver).resolveDispute(1, 10_000),
        "TransferFailed",
      );
      assert.equal((await escrow.getEscrow(1)).status, 4n);
      assert.equal(await escrow.totalLiability(), AMOUNT);
    });

    it("rolls back dispute resolution when the seller rejects ETH", async function () {
      const { escrow, buyer, resolver } = await loadFixture(deployFixture);
      const rejector: any = await (
        await ethers.getContractFactory("RejectingReceiver")
      ).deploy(await escrow.getAddress());
      await rejector.waitForDeployment();
      await escrow
        .connect(buyer)
        .createEscrow(
          await rejector.getAddress(),
          (await time.latest()) + 3_600,
          META,
          { value: AMOUNT },
        );
      await escrow.connect(buyer).raiseDispute(1);
      await expectRevert(
        escrow.connect(resolver).resolveDispute(1, 0),
        "TransferFailed",
      );
      assert.equal((await escrow.getEscrow(1)).status, 4n);
      assert.equal(await escrow.totalLiability(), AMOUNT);
    });

    it("keeps forced ETH separate from active liabilities", async function () {
      const { escrow } = await loadFixture(createFunded);
      const forcedAmount = 123n;
      const forceEther: any = await (
        await ethers.getContractFactory("ForceEther")
      ).deploy({ value: forcedAmount });
      await forceEther.waitForDeployment();
      await forceEther.forceSend(await escrow.getAddress());
      assert.equal(await escrow.totalLiability(), AMOUNT);
      assert.equal(
        await ethers.provider.getBalance(await escrow.getAddress()),
        AMOUNT + forcedAmount,
      );
    });

    it("tracks multiple liabilities across mixed terminal paths", async function () {
      const { escrow, buyer, seller, resolver } =
        await loadFixture(deployFixture);
      const deadline = (await time.latest()) + 3_600;
      const amounts = [11n, 22n, 33n];
      for (const amount of amounts) {
        await escrow
          .connect(buyer)
          .createEscrow(seller.address, deadline, META, { value: amount });
      }
      assert.equal(await escrow.totalLiability(), 66n);

      await escrow.connect(seller).markDelivered(1, DELIVERY);
      await escrow.connect(buyer).releaseFunds(1);
      assert.equal(await escrow.totalLiability(), 55n);

      await escrow.connect(seller).approveRefund(2);
      assert.equal(await escrow.totalLiability(), 33n);

      await escrow.connect(buyer).raiseDispute(3);
      await escrow.connect(resolver).resolveDispute(3, 3_333);
      assert.equal(await escrow.totalLiability(), 0n);
      assert.equal(
        await ethers.provider.getBalance(await escrow.getAddress()),
        0n,
      );
    });

    it("keeps completed escrows terminal", async function () {
      const { escrow, buyer, seller, escrowId } =
        await loadFixture(createDelivered);
      await escrow.connect(buyer).releaseFunds(escrowId);
      await expectRevert(
        escrow.connect(seller).approveRefund(escrowId),
        "InvalidStatus",
      );
      await expectRevert(
        escrow.connect(buyer).raiseDispute(escrowId),
        "InvalidStatus",
      );
    });

    it("keeps refunded escrows terminal", async function () {
      const { escrow, buyer, seller, escrowId } =
        await loadFixture(createFunded);
      await escrow.connect(seller).approveRefund(escrowId);
      await expectRevert(
        escrow.connect(buyer).releaseFunds(escrowId),
        "InvalidStatus",
      );
      await expectRevert(
        escrow.connect(buyer).raiseDispute(escrowId),
        "InvalidStatus",
      );
    });
  });
});
