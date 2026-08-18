"use client";

import { useCallback, useEffect, useState } from "react";
import { useConnection, useSignMessage } from "wagmi";

import { giwaSepolia } from "@/config/web3";
import {
  AccordChatHttpError,
  readAccordChatJson,
} from "@/services/deal-room/client-api";
import {
  sessionResponseState,
  type WalletAuthUiState,
} from "./wallet-auth-model";

export type WalletAuthState = WalletAuthUiState;

function rejectedSignature(error: unknown) {
  const candidate = error as { code?: number; shortMessage?: string };
  return (
    candidate?.code === 4001 ||
    /rejected|denied|cancelled/i.test(
      candidate?.shortMessage ??
        (error instanceof Error ? error.message : String(error)),
    )
  );
}

export function useWalletSessionAuth() {
  const connection = useConnection();
  const signer = useSignMessage();
  const [state, setState] = useState<WalletAuthState>("checking-session");
  const [error, setError] = useState("");

  const checkSession = useCallback(async () => {
    if (connection.status !== "connected" || !connection.address) {
      setState("authentication-required");
      return false;
    }
    setState("checking-session");
    try {
      const response = await fetch("/api/accord-chat/auth/session", {
        cache: "no-store",
      });
      if (response.status === 401) {
        setState(sessionResponseState(response.status));
        return false;
      }
      const body = await readAccordChatJson<{
        wallet?: string;
      }>(response, "Wallet session could not be checked.");
      if (
        !body.wallet ||
        body.wallet.toLowerCase() !== connection.address.toLowerCase()
      ) {
        setState("authentication-required");
        return false;
      }
      setError("");
      setState("authenticated");
      return true;
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Wallet session could not be checked.",
      );
      setState("failed");
      return false;
    }
  }, [connection.address, connection.status]);

  useEffect(() => {
    const timer = window.setTimeout(() => void checkSession(), 0);
    return () => window.clearTimeout(timer);
  }, [checkSession, connection.chainId]);

  const authenticate = useCallback(async () => {
    if (connection.status !== "connected" || !connection.address) {
      setError("Connect a wallet before authenticating Accord Chat.");
      setState("authentication-required");
      return false;
    }
    if (connection.chainId !== giwaSepolia.id) {
      setError("Switch to GIWA Sepolia before authenticating.");
      setState("failed");
      return false;
    }
    setError("");
    try {
      setState("signing-challenge");
      const challengeResponse = await fetch("/api/accord-chat/auth/challenge", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          address: connection.address,
          chainId: connection.chainId,
        }),
      });
      const challenge = await readAccordChatJson<{
        challengeId?: string;
        message?: string;
      }>(challengeResponse, "Authentication challenge failed.");
      if (!challenge.challengeId || !challenge.message) {
        throw new Error("Authentication challenge response was incomplete.");
      }

      const signature = await signer.mutateAsync({
        message: challenge.message,
      });
      setState("verifying-signature");
      const verifyResponse = await fetch("/api/accord-chat/auth/verify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          address: connection.address,
          challengeId: challenge.challengeId,
          message: challenge.message,
          signature,
        }),
      });
      const verified = await readAccordChatJson<{
        authenticated?: boolean;
      }>(verifyResponse, "Wallet authentication failed.");
      if (!verified.authenticated) {
        throw new Error("Wallet authentication response was incomplete.");
      }
      setState("authenticated");
      return true;
    } catch (caught) {
      setError(
        rejectedSignature(caught)
          ? "The wallet signature request was rejected. No transaction was sent."
          : caught instanceof AccordChatHttpError
            ? caught.message
            : caught instanceof Error
              ? caught.message
              : "Wallet authentication failed.",
      );
      setState("failed");
      return false;
    }
  }, [connection.address, connection.chainId, connection.status, signer]);

  return {
    address: connection.address,
    chainId: connection.chainId,
    connected: connection.status === "connected",
    state,
    error,
    authenticate,
    checkSession,
  };
}
