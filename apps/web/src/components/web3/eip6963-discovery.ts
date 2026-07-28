"use client";

import type { EIP1193Provider } from "viem";

export type Eip6963ProviderDetail = {
  info: {
    uuid: string;
    name: string;
    icon: string;
    rdns: string;
  };
  provider: EIP1193Provider;
};

let providers: readonly Eip6963ProviderDetail[] = [];
const providerUuids = new Set<string>();
const providerRdns = new Set<string>();
const listeners = new Set<() => void>();
const emptyProviders: readonly Eip6963ProviderDetail[] = [];
let listening = false;
let requested = false;

function notify() {
  listeners.forEach((listener) => listener());
}

function announceProvider(event: Event) {
  const detail = (event as CustomEvent<Eip6963ProviderDetail>).detail;
  if (
    !detail?.provider ||
    !detail.info?.uuid ||
    !detail.info.rdns ||
    !detail.info.name ||
    providerUuids.has(detail.info.uuid) ||
    providerRdns.has(detail.info.rdns)
  ) {
    return;
  }

  providerUuids.add(detail.info.uuid);
  providerRdns.add(detail.info.rdns);
  providers = [...providers, detail];
  notify();
}

function startDiscovery() {
  if (typeof window === "undefined") return;

  if (!listening) {
    window.addEventListener("eip6963:announceProvider", announceProvider);
    listening = true;
  }

  if (!requested) {
    requested = true;
    window.dispatchEvent(new Event("eip6963:requestProvider"));
  }
}

export function subscribeToProviders(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getProviderSnapshot() {
  return providers;
}

export function getServerProviderSnapshot(): readonly Eip6963ProviderDetail[] {
  return emptyProviders;
}

export function requestEip6963Providers() {
  startDiscovery();
}

export function safeWalletIcon(icon: string) {
  if (icon.length > 100_000) return undefined;
  return /^data:image\/(?:png|jpeg|webp|gif);base64,[a-z0-9+/=]+$/i.test(icon)
    ? icon
    : undefined;
}
