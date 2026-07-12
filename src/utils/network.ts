export function isLoopbackHost(host: string): boolean {
  const normalized = host.trim().toLowerCase();
  return normalized === "127.0.0.1" || normalized === "::1" || normalized === "localhost";
}

export function hasValidBearerToken(expectedToken: string, authorizationHeader: string | string[] | undefined): boolean {
  if (!expectedToken) {
    return true;
  }

  const header = Array.isArray(authorizationHeader) ? authorizationHeader[0] : authorizationHeader;
  if (!header?.startsWith("Bearer ")) {
    return false;
  }

  return header.slice("Bearer ".length) === expectedToken;
}
