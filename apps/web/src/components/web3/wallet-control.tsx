"use client";

import Image from "next/image";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import {
  useConnect,
  useConnection,
  useDisconnect,
  useSwitchChain,
} from "wagmi";
import { injected } from "wagmi/connectors";

import { giwaSepolia, wagmiConfig } from "@/config/web3";
import { useUpbitName } from "@/hooks/use-upbit-name";

import { Badge, Button, Spinner } from "../ui";
import { getConnectedWalletIdentityView } from "./connected-wallet-identity";
import {
  getProviderSnapshot,
  getServerProviderSnapshot,
  requestEip6963Providers,
  safeWalletIcon,
  subscribeToProviders,
  type Eip6963ProviderDetail,
} from "./eip6963-discovery";
import styles from "./web3.module.css";

const supportedWallets = [
  { name: "MetaMask", rdns: ["io.metamask"] },
  { name: "Rabby Wallet", rdns: ["io.rabby"] },
  { name: "OKX Wallet", rdns: ["com.okex.wallet"] },
  { name: "Phantom", rdns: ["app.phantom"] },
  { name: "Keplr", rdns: ["com.keplr"] },
  { name: "SubWallet", rdns: ["app.subwallet"] },
  { name: "Backpack", rdns: ["app.backpack"] },
  { name: "Leap Wallet", rdns: ["io.leapwallet"] },
] as const;

export function WalletControl({ compact = false }: { compact?: boolean }) {
  const connection = useConnection();
  const connect = useConnect();
  const disconnect = useDisconnect();
  const switchChain = useSwitchChain();
  const announcedProviders = useSyncExternalStore(
    subscribeToProviders,
    getProviderSnapshot,
    getServerProviderSnapshot,
  );
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const firstWalletRef = useRef<HTMLButtonElement>(null);
  const [selectedUid, setSelectedUid] = useState<string>();
  const connectedAddress = connection.address ?? "";
  const upbitName = useUpbitName(
    connectedAddress,
    connection.status === "connected",
  );
  const connectedIdentity = connectedAddress
    ? getConnectedWalletIdentityView(
        connectedAddress,
        upbitName.state,
        upbitName.result,
      )
    : undefined;
  const refetchUpbitName = upbitName.refetch;

  useEffect(() => {
    if (connection.status === "connected" && connectedAddress) {
      void refetchUpbitName();
    }
  }, [
    connectedAddress,
    connection.chainId,
    connection.status,
    refetchUpbitName,
  ]);

  const detectedOptions = useMemo(
    () => announcedProviders,
    [announcedProviders],
  );
  const detectedRdns = new Set(
    announcedProviders.map((detail) => detail.info.rdns),
  );
  const unavailableOptions = supportedWallets.filter(
    (wallet) => !wallet.rdns.some((rdns) => detectedRdns.has(rdns)),
  );

  useEffect(() => {
    if (connection.status === "connected" && dialogRef.current?.open) {
      dialogRef.current.close();
    }
  }, [connection.status]);

  function openDialog() {
    setSelectedUid(undefined);
    connect.reset();
    dialogRef.current?.showModal();
    requestEip6963Providers();
    window.setTimeout(() => firstWalletRef.current?.focus(), 0);
  }

  function closeDialog() {
    dialogRef.current?.close();
  }

  function requestConnection(detail: Eip6963ProviderDetail) {
    if (connect.isPending) return;
    setSelectedUid(detail.info.uuid);
    const connector = wagmiConfig._internal.connectors.setup(
      injected({
        target: {
          icon: safeWalletIcon(detail.info.icon),
          id: detail.info.rdns,
          name: detail.info.name,
          provider: detail.provider,
        },
      }),
    );
    connect.mutate({ connector });
  }

  if (
    connection.status === "connected" &&
    connection.chainId !== giwaSepolia.id
  ) {
    return (
      <div className={styles.walletControl}>
        {connectedIdentity ? (
          <span
            className={styles.connectedIdentity}
            title={connectedIdentity.statusLabel}
          >
            <strong>{connectedIdentity.primary}</strong>
            {connectedIdentity.secondary ? (
              <small>{connectedIdentity.secondary}</small>
            ) : null}
          </span>
        ) : null}
        <Button
          variant="secondary"
          loading={switchChain.isPending}
          loadingText="Switching network"
          onClick={() => switchChain.mutate({ chainId: giwaSepolia.id })}
        >
          Switch to GIWA Sepolia
        </Button>
        <Button variant="ghost" onClick={() => disconnect.mutate()}>
          Disconnect
        </Button>
      </div>
    );
  }

  if (connection.status === "connected" && connection.address) {
    return (
      <div className={styles.walletControl}>
        {!compact && <Badge status="testnet">GIWA Sepolia</Badge>}
        <span
          className={styles.connectedIdentity}
          title={connectedIdentity?.statusLabel}
          aria-live="polite"
        >
          <strong>
            <span className={styles.connectedDot} aria-hidden="true" />
            {connectedIdentity?.primary}
          </strong>
          {connectedIdentity?.secondary ? (
            <small>{connectedIdentity.secondary}</small>
          ) : null}
        </span>
        <button
          className={styles.identityRefresh}
          type="button"
          onClick={() =>
            void upbitName.refresh().then(() => upbitName.refetch())
          }
          disabled={upbitName.state === "resolving"}
        >
          Refresh identity
        </button>
        <Button variant="ghost" onClick={() => disconnect.mutate()}>
          Disconnect
        </Button>
      </div>
    );
  }

  return (
    <>
      <button
        ref={triggerRef}
        className={styles.connectTrigger}
        type="button"
        onClick={openDialog}
      >
        Connect wallet
      </button>
      <dialog
        ref={dialogRef}
        className={styles.walletDialog}
        aria-labelledby="wallet-dialog-title"
        aria-describedby="wallet-dialog-description"
        onClose={() => triggerRef.current?.focus()}
        onClick={(event) => {
          if (event.target === event.currentTarget) closeDialog();
        }}
      >
        <div className={styles.walletDialogContent}>
          <div className={styles.walletDialogHeading}>
            <div>
              <h2 id="wallet-dialog-title">Connect a wallet</h2>
              <p id="wallet-dialog-description">
                Select a detected wallet for GIWA Sepolia.
              </p>
            </div>
            <button
              className={styles.closeButton}
              type="button"
              aria-label="Close wallet selector"
              onClick={closeDialog}
            >
              ×
            </button>
          </div>

          <h3 className={styles.walletSectionTitle}>Detected wallets</h3>
          {detectedOptions.length ? (
            <ul className={styles.walletList}>
              {detectedOptions.map((detail, index) => (
                <li key={detail.info.uuid}>
                  <button
                    ref={index === 0 ? firstWalletRef : undefined}
                    className={styles.walletOption}
                    type="button"
                    disabled={connect.isPending}
                    onClick={() => requestConnection(detail)}
                  >
                    <span className={styles.walletIdentity}>
                      {safeWalletIcon(detail.info.icon) ? (
                        <Image
                          alt=""
                          aria-hidden="true"
                          height={28}
                          src={safeWalletIcon(detail.info.icon)!}
                          unoptimized
                          width={28}
                        />
                      ) : (
                        <span
                          aria-hidden="true"
                          className={styles.walletInitial}
                        >
                          {detail.info.name.slice(0, 1).toUpperCase()}
                        </span>
                      )}
                      <span>{detail.info.name}</span>
                    </span>
                    {selectedUid === detail.info.uuid && connect.isPending ? (
                      <Spinner
                        size="small"
                        label={`Connecting ${detail.info.name}`}
                      />
                    ) : (
                      <span className={styles.detected}>Detected</span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className={styles.noWallets}>
              No EIP-6963 wallets were announced by this browser.
            </p>
          )}

          {unavailableOptions.length > 0 && (
            <>
              <h3 className={styles.walletSectionTitle}>
                Other supported wallets
              </h3>
              <ul className={styles.walletList}>
                {unavailableOptions.map((wallet) => (
                  <li key={wallet.name}>
                    <div className={styles.walletUnavailable}>
                      <span>{wallet.name}</span>
                      <span>Not detected</span>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}

          {connect.error && (
            <p className={styles.walletError} role="alert">
              {selectedUid
                ? `The selected wallet did not connect: ${connect.error.message}`
                : connect.error.message}
            </p>
          )}
        </div>
      </dialog>
    </>
  );
}
