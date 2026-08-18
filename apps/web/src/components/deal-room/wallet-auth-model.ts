export type WalletAuthUiState =
  | "checking-session"
  | "authentication-required"
  | "signing-challenge"
  | "verifying-signature"
  | "authenticated"
  | "failed";

export function sessionResponseState(status: number): WalletAuthUiState {
  if (status === 200) return "authenticated";
  if (status === 401) return "authentication-required";
  return "failed";
}

export function shouldFetchProtectedChat(state: WalletAuthUiState) {
  return state === "authenticated";
}

export function authenticationUsesTransaction() {
  return false;
}
