const v2BetaBannerDismissedStorageKey = 'home-v2-beta-banner-dismissed';

export const v2BetaLink = 'https://new.tacticusplanner.app';

export const v2BetaUpdatesLink = 'https://tacticusplanner.userjot.com/updates';

// A dismissal hides the banner for 7 days, then it comes back so players see new V2 updates.
const v2BetaBannerSnoozeMs = 7 * 24 * 60 * 60 * 1000;

export function isV2BetaBannerVisible(now: number = Date.now()): boolean {
    try {
        // Older builds stored 'true' with no time; it parses as NaN, so those players see the banner again.
        const dismissedAt = Number(localStorage.getItem(v2BetaBannerDismissedStorageKey));
        return !Number.isFinite(dismissedAt) || dismissedAt <= 0 || now - dismissedAt >= v2BetaBannerSnoozeMs;
    } catch {
        return true;
    }
}

export function dismissV2BetaBanner(now: number = Date.now()): void {
    try {
        localStorage.setItem(v2BetaBannerDismissedStorageKey, String(now));
    } catch {
        // Storage can be blocked; the banner then hides for this visit only.
    }
}
