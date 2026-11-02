import { afterEach, describe, expect, it, vi } from 'vitest';

import { dismissV2BetaBanner, isV2BetaBannerVisible, isV2BetaPromoActive } from './v2-beta-banner';

describe('V2 beta banner', () => {
    afterEach(() => {
        vi.mocked(localStorage.getItem).mockReset();
        vi.mocked(localStorage.setItem).mockReset();
    });

    it('mentions the promo code only until it expires', () => {
        expect(isV2BetaPromoActive(new Date(2026, 10, 7, 23, 59))).toBe(true);
        expect(isV2BetaPromoActive(new Date(2026, 10, 8))).toBe(false);
    });

    it('shows until dismissed, then stays hidden on the device', () => {
        expect(isV2BetaBannerVisible()).toBe(true);

        dismissV2BetaBanner();
        expect(localStorage.setItem).toHaveBeenCalledWith('home-v2-beta-banner-dismissed', 'true');

        vi.mocked(localStorage.getItem).mockReturnValue('true');
        expect(isV2BetaBannerVisible()).toBe(false);
    });
});
