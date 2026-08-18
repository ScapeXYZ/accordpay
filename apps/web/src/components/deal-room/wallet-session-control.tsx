"use client";

import { Button } from "@/components/ui";
import { useWalletSessionAuth } from "./use-wallet-session-auth";

export function WalletSessionControl({
  onAuthenticated,
}: {
  onAuthenticated?: () => void;
}) {
  const auth = useWalletSessionAuth();

  async function authenticate() {
    if (await auth.authenticate()) onAuthenticated?.();
  }

  return (
    <div>
      <Button
        type="button"
        onClick={() => void authenticate()}
        loading={
          auth.state === "signing-challenge" ||
          auth.state === "verifying-signature"
        }
        loadingText={
          auth.state === "verifying-signature"
            ? "Verifying signature"
            : "Awaiting signature"
        }
        disabled={!auth.connected}
      >
        Authenticate wallet
      </Button>
      {auth.error ? <p role="alert">{auth.error}</p> : null}
    </div>
  );
}
