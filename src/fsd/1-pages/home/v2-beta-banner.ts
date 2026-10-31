const v2BetaBannerDismissedStorageKey = 'home-v2-beta-banner-dismissed';

export const v2BetaLink = 'https://new.tacticusplanner.app';

// TODO: replace with the V2 public beta post once it is published on UserJot.
export const v2BetaAnnouncementLink = 'https://tacticusplanner.userjot.com/updates';

// The promo code is valid through 7 November 2026, so the banner disappears at the start of 8 November local time.
const v2BetaBannerEndsAt = new Date(2026, 10, 8);

export function isV2BetaBannerVisible(now: Date = new Date()): boolean {
    if (now >= v2BetaBannerEndsAt) return false;
    try {
        return localStorage.getItem(v2BetaBannerDismissedStorageKey) !== 'true';
    } catch {
        return true;
    }
}

export function dismissV2BetaBanner(): void {
    try {
        localStorage.setItem(v2BetaBannerDismissedStorageKey, 'true');
    } catch {
        // Storage can be blocked; the banner then hides for this visit only.
    }
}
