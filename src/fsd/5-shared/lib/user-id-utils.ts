const UUID_RE = /^[0-9a-z]{8}-[0-9a-z]{4}-[0-9a-z]{4}-[0-9a-z]{4}-[0-9a-z]{12}$/;

export function isLikelyUserId(value: string): boolean {
    return UUID_RE.test(value);
}

/** Obfuscates a UUID by replacing middle characters with asterisks, keeping the first and last 4. */
export function obfuscateUserId(userId: string): string {
    return userId.slice(0, 4) + userId.slice(4, -4).replaceAll(/[a-z0-9A-Z]/g, '*') + userId.slice(-4);
}
