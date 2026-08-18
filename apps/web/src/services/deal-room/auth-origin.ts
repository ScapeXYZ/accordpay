export function normalizeAppOrigin(value: string) {
  const url = new URL(value.trim());
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new Error("APP_URL must use HTTP or HTTPS.");
  }
  if (url.username || url.password) {
    throw new Error("APP_URL must not contain credentials.");
  }
  return url.origin;
}

export function requireApprovedAuthenticationOrigin(
  configuredAppUrl: string | undefined,
  browserOrigin: string | null,
) {
  if (!configuredAppUrl?.trim()) {
    throw new Error("APP_URL is not configured.");
  }
  if (!browserOrigin?.trim()) {
    throw new Error("Authentication request origin is missing.");
  }

  const approvedOrigin = normalizeAppOrigin(configuredAppUrl);
  const requestOrigin = normalizeAppOrigin(browserOrigin);
  if (requestOrigin !== approvedOrigin) {
    throw new Error("Authentication origin does not match APP_URL.");
  }
  return approvedOrigin;
}
