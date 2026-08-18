import { getAddress, isAddress } from "viem";

import {
  activityEventNames,
  activityStatuses,
  type ActivityEventName,
  type ActivityStatus,
} from "./activity-types.ts";

export type ActivityValidationResult =
  | {
      ok: true;
      wallet: `0x${string}`;
      event?: ActivityEventName;
      status?: ActivityStatus;
    }
  | {
      ok: false;
      error: {
        code: string;
        method: "validation";
        retryable: false;
        message: string;
      };
    };

function invalid(code: string, message: string): ActivityValidationResult {
  return {
    ok: false,
    error: { code, method: "validation", retryable: false, message },
  };
}

export function validateActivityQuery(
  params: Pick<URLSearchParams, "get">,
): ActivityValidationResult {
  const wallet = params.get("wallet")?.trim() ?? "";
  const eventValue = params.get("event");
  const statusValue = params.get("status");
  if (!isAddress(wallet)) {
    return invalid("INVALID_WALLET", "A valid wallet address is required.");
  }
  if (
    eventValue &&
    !activityEventNames.includes(eventValue as ActivityEventName)
  ) {
    return invalid(
      "INVALID_EVENT",
      "The requested event filter is unsupported.",
    );
  }
  if (
    statusValue &&
    !activityStatuses.includes(statusValue as ActivityStatus)
  ) {
    return invalid(
      "INVALID_STATUS",
      "The requested status filter is unsupported.",
    );
  }
  return {
    ok: true,
    wallet: getAddress(wallet),
    event: eventValue as ActivityEventName | undefined,
    status: statusValue as ActivityStatus | undefined,
  };
}
