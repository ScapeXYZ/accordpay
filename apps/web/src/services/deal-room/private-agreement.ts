export const PRIVATE_AGREEMENT_ALGORITHM = "AES-GCM";
export const PRIVATE_AGREEMENT_FORMAT_VERSION = 1;

export type EncryptedAgreementPayload = {
  version: 1;
  algorithm: "AES-GCM";
  iv: string;
  ciphertext: string;
};

function base64(bytes: Uint8Array) {
  return btoa(String.fromCharCode(...bytes));
}

function fromBase64(value: string) {
  return Uint8Array.from(atob(value), (character) => character.charCodeAt(0));
}

export async function encryptAgreementLocally(
  plaintext: string,
  key?: CryptoKey,
): Promise<{ payload: EncryptedAgreementPayload; key: CryptoKey }> {
  const encryptionKey =
    key ??
    (await crypto.subtle.generateKey(
      { name: PRIVATE_AGREEMENT_ALGORITHM, length: 256 },
      true,
      ["encrypt", "decrypt"],
    ));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt(
    { name: PRIVATE_AGREEMENT_ALGORITHM, iv },
    encryptionKey,
    new TextEncoder().encode(plaintext),
  );
  return {
    key: encryptionKey,
    payload: {
      version: PRIVATE_AGREEMENT_FORMAT_VERSION,
      algorithm: PRIVATE_AGREEMENT_ALGORITHM,
      iv: base64(iv),
      ciphertext: base64(new Uint8Array(ciphertext)),
    },
  };
}

export async function decryptAgreementLocally(
  payload: EncryptedAgreementPayload,
  key: CryptoKey,
) {
  if (
    payload.version !== PRIVATE_AGREEMENT_FORMAT_VERSION ||
    payload.algorithm !== PRIVATE_AGREEMENT_ALGORITHM
  ) {
    throw new Error("Unsupported encrypted agreement format.");
  }
  const plaintext = await crypto.subtle.decrypt(
    { name: PRIVATE_AGREEMENT_ALGORITHM, iv: fromBase64(payload.iv) },
    key,
    fromBase64(payload.ciphertext),
  );
  return new TextDecoder().decode(plaintext);
}

export function canFinalizePrivateAgreement() {
  // EIP-6963 identifies providers but does not guarantee a standard,
  // participant-targeted encryption public key. Never silently downgrade.
  return false;
}
