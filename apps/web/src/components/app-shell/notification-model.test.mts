import assert from "node:assert/strict";
import test from "node:test";

import type { Address, Hex } from "viem";

import {
  getUnreadCount,
  markAllNotificationsRead,
  notificationPanelReducer,
  notificationStorageKey,
  notificationsFromContractLogs,
} from "./notification-model.ts";

const address = "0x77489c28FBd71Be2f78F2eC206cDe5C39A44290d" as Address;
const hash = `0x${"1".repeat(64)}` as Hex;

test("notification panel opens and closes", () => {
  const opened = notificationPanelReducer({ open: false }, { type: "open" });
  assert.equal(opened.open, true);
  assert.equal(notificationPanelReducer(opened, { type: "close" }).open, false);
});

test("no matching contract logs produce the empty state data", () => {
  assert.deepEqual(notificationsFromContractLogs([], address), []);
  assert.deepEqual(
    notificationsFromContractLogs(
      [
        {
          eventName: "EscrowCreated",
          args: {
            escrowId: BigInt(1),
            buyer: "0xFC1DC0f5C79a0a47E733476d61209E734a649094",
            seller: "0xFC1DC0f5C79a0a47E733476d61209E734a649094",
          },
          transactionHash: hash,
          blockNumber: BigInt(1),
          logIndex: 0,
        },
      ],
      address,
    ),
    [],
  );
});

test("real matching events are unread until marked read", () => {
  const notifications = notificationsFromContractLogs(
    [
      {
        eventName: "EscrowCreated",
        args: {
          escrowId: BigInt(4),
          buyer: address,
          seller: "0xFC1DC0f5C79a0a47E733476d61209E734a649094",
          amount: BigInt(1),
        },
        transactionHash: hash,
        blockNumber: BigInt(100),
        logIndex: 2,
      },
    ],
    address,
  );

  assert.equal(notifications.length, 1);
  assert.equal(notifications[0]?.title, "Escrow funded");
  assert.equal(getUnreadCount(notifications, new Set()), 1);
  const read = markAllNotificationsRead(notifications);
  assert.equal(getUnreadCount(notifications, read), 0);
});

test("read-state keys are isolated by account and network", () => {
  assert.notEqual(
    notificationStorageKey(91_342, address),
    notificationStorageKey(
      91_342,
      "0xFC1DC0f5C79a0a47E733476d61209E734a649094",
    ),
  );
  assert.notEqual(
    notificationStorageKey(91_342, address),
    notificationStorageKey(1, address),
  );
});
