"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { Stack } from "@/components/layout";
import { Alert, Button, Card, Input, Select, Spinner } from "@/components/ui";

import { WalletSessionControl } from "./wallet-session-control";
import styles from "./deal-room.module.css";

type Room = {
  id: string;
  title: string;
  status: string;
  role: "buyer" | "seller";
  current_version: number;
  escrow_id: string | null;
};

export function DealRoomList() {
  const searchParams = useSearchParams();
  const inviteToken = searchParams.get("invite");
  const [rooms, setRooms] = useState<Room[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "auth" | "error">(
    "loading",
  );
  const [title, setTitle] = useState("");
  const [invite, setInvite] = useState("");
  const [role, setRole] = useState("buyer");
  const [error, setError] = useState("");
  const [createdInvite, setCreatedInvite] = useState<{
    roomId: string;
    token: string;
  }>();

  const load = useCallback(async () => {
    const response = await fetch("/api/deal-rooms", { cache: "no-store" });
    if (response.status === 401) {
      setState("auth");
      return;
    }
    if (!response.ok) {
      setState("error");
      return;
    }
    const body = (await response.json()) as { rooms: Room[] };
    setRooms(body.rooms);
    setState("ready");
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/deal-rooms", {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        if (response.status === 401) {
          setState("auth");
          return;
        }
        if (!response.ok) {
          setState("error");
          return;
        }
        const body = (await response.json()) as { rooms: Room[] };
        setRooms(body.rooms);
        setState("ready");
      })
      .catch(() => {
        if (!controller.signal.aborted) setState("error");
      });
    return () => controller.abort();
  }, []);

  async function createRoom(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    const response = await fetch("/api/deal-rooms", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title, invite, role }),
    });
    const body = (await response.json()) as {
      roomId?: string;
      inviteToken?: string;
      error?: { message: string };
    };
    if (!response.ok || !body.roomId || !body.inviteToken) {
      setError(body.error?.message ?? "Accord Chat could not be created.");
      return;
    }
    setCreatedInvite({ roomId: body.roomId, token: body.inviteToken });
    await load();
  }

  async function acceptInvite() {
    if (!inviteToken) return;
    const response = await fetch("/api/deal-rooms/invites/accept", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ token: inviteToken }),
    });
    const body = (await response.json()) as {
      roomId?: string;
      error?: { message: string };
    };
    if (!response.ok || !body.roomId) {
      setError(body.error?.message ?? "Invitation could not be accepted.");
      return;
    }
    window.location.assign(
      `/app?accordChat=room&roomId=${encodeURIComponent(body.roomId)}`,
    );
  }

  if (state === "loading") {
    return <Spinner label="Loading private Accord Chat conversations" />;
  }
  if (state === "auth") {
    return (
      <Alert
        variant="info"
        title="Authenticate your wallet"
        description="A message signature creates a private server session. It does not submit a transaction."
        action={<WalletSessionControl onAuthenticated={() => void load()} />}
      />
    );
  }
  if (state === "error") {
    return (
      <Alert
        variant="error"
        title="Accord Chat unavailable"
        description="Check the secure database configuration and retry."
        action={<Button onClick={() => void load()}>Retry</Button>}
      />
    );
  }

  return (
    <Stack gap={6}>
      {inviteToken ? (
        <Alert
          variant="info"
          title="Accord Chat invitation"
          description="Accept only if this invitation was sent by your intended counterparty. The authenticated wallet must match the invited address."
          action={
            <Button type="button" onClick={() => void acceptInvite()}>
              Accept invitation
            </Button>
          }
        />
      ) : null}
      <Card>
        <form className={styles.createForm} onSubmit={createRoom}>
          <Input
            label="Room title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            required
          />
          <Select
            label="My intended role"
            value={role}
            onChange={(event) => setRole(event.target.value)}
            options={[
              { label: "Buyer", value: "buyer" },
              { label: "Seller", value: "seller" },
            ]}
          />
          <Input
            label="Counterparty wallet or UP ID"
            value={invite}
            onChange={(event) => setInvite(event.target.value)}
            placeholder="0x… or username.up.id"
            required
          />
          <Button type="submit">Start agreement chat</Button>
        </form>
        {error ? <p role="alert">{error}</p> : null}
        {createdInvite ? (
          <div>
            <strong>Invitation ready</strong>
            <p>
              Share this private invitation only with the intended counterparty.
            </p>
            <Input
              label="Invite link"
              readOnly
              value={`${window.location.origin}/app?accordChat=open&invite=${createdInvite.token}`}
            />
            <Button
              type="button"
              variant="secondary"
              onClick={() =>
                void navigator.clipboard.writeText(
                  `${window.location.origin}/app?accordChat=open&invite=${createdInvite.token}`,
                )
              }
            >
              Copy invitation
            </Button>
          </div>
        ) : null}
      </Card>
      {rooms.length === 0 ? (
        <Card variant="tinted">
          <strong>No agreement chats yet</strong>
          <p>Create a private room to negotiate an agreement.</p>
        </Card>
      ) : (
        <div className={styles.roomGrid}>
          {rooms.map((room) => (
            <Link
              href={`/app?accordChat=room&roomId=${encodeURIComponent(room.id)}`}
              key={room.id}
            >
              <Card variant="interactive">
                <strong>{room.title}</strong>
                <span>{room.status.replaceAll("_", " ")}</span>
                <span>
                  {room.role} · version {room.current_version || "—"}
                </span>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </Stack>
  );
}
