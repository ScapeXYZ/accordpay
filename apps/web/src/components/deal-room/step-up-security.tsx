"use client";

import { createClient } from "@supabase/supabase-js";
import { useState } from "react";

import { Alert, Button, Input } from "@/components/ui";

export function StepUpSecurity() {
  const [factorId, setFactorId] = useState("");
  const [qr, setQr] = useState("");
  const [code, setCode] = useState("");
  const [status, setStatus] = useState("");

  function client() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) throw new Error("Supabase Auth is not configured.");
    return createClient(url, key);
  }

  async function enroll() {
    try {
      const supabase = client();
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        throw new Error(
          "Sign in to the private Supabase Auth security session first.",
        );
      }
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: "AccordPay",
      });
      if (error) throw error;
      setFactorId(data.id);
      setQr(data.totp.qr_code);
      setStatus("Scan the TOTP code, then enter a fresh verification code.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Enrollment failed.");
    }
  }

  async function verify() {
    try {
      const supabase = client();
      const challenge = await supabase.auth.mfa.challenge({ factorId });
      if (challenge.error) throw challenge.error;
      const verification = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challenge.data.id,
        code: code.trim(),
      });
      if (verification.error) throw verification.error;
      const response = await fetch("/api/security/step-up", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          accessToken: verification.data.access_token,
        }),
      });
      const body = (await response.json()) as {
        error?: { message: string };
      };
      if (!response.ok) {
        throw new Error(body.error?.message ?? "Verification failed.");
      }
      setCode("");
      setStatus("Additional verification is active for 10 minutes.");
    } catch (error) {
      setStatus(
        error instanceof Error ? error.message : "Verification failed.",
      );
    }
  }

  return (
    <>
      <h2>Additional verification</h2>
      <Alert
        variant="warning"
        title="Application protection only"
        description="Additional verification protects actions performed through AccordPay. A person controlling your wallet may still interact directly with the current smart contract."
      />
      <p>
        Optional TOTP step-up protects sensitive actions performed through this
        website.
      </p>
      {!factorId ? (
        <Button type="button" variant="secondary" onClick={() => void enroll()}>
          Enrol TOTP
        </Button>
      ) : (
        <>
          {qr ? (
            // Supabase supplies a local encoded QR image for this factor.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={qr} width="192" height="192" alt="TOTP setup QR code" />
          ) : null}
          <Input
            label="Authenticator code"
            inputMode="numeric"
            autoComplete="one-time-code"
            value={code}
            onChange={(event) => setCode(event.target.value)}
          />
          <Button
            type="button"
            onClick={() => void verify()}
            disabled={!/^\d{6}$/.test(code)}
          >
            Verify
          </Button>
        </>
      )}
      {status ? <p role="status">{status}</p> : null}
    </>
  );
}
