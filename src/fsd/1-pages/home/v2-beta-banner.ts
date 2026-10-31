const v2BetaBannerDismissedStorageKey = 'home-v2-beta-banner-dismissed';

export const v2BetaLink = 'https://new.tacticusplanner.app';

export const v2BetaAnnouncementLink = 'https://tacticusplanner.userjot.com/updates/p/v2-public-beta-announcement';

// The V2 promo code is valid through 7 November 2026, so the card stops mentioning it at the start of 8 November local time.
const v2BetaPromoEndsAt = new Date(2026, 10, 8);

export function isV2BetaPromoActive(now: Date = new Date()): boolean {
    return now < v2BetaPromoEndsAt;
}

export function isV2BetaBannerVisible(): boolean {
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
