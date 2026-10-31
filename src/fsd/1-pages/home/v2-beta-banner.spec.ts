import { afterEach, describe, expect, it, vi } from 'vitest';

import { dismissV2BetaBanner, isV2BetaBannerVisible } from './v2-beta-banner';

describe('V2 beta banner', () => {
    afterEach(() => {
        vi.mocked(localStorage.getItem).mockReset();
        vi.mocked(localStorage.setItem).mockReset();
    });

    it('shows until the promo code expires', () => {
        expect(isV2BetaBannerVisible(new Date(2026, 10, 7, 23, 59))).toBe(true);
        expect(isV2BetaBannerVisible(new Date(2026, 10, 8))).toBe(false);
    });

    it('records dismissal on the device and stays hidden', () => {
        dismissV2BetaBanner();
        expect(localStorage.setItem).toHaveBeenCalledWith('home-v2-beta-banner-dismissed', 'true');

        vi.mocked(localStorage.getItem).mockReturnValue('true');
        expect(isV2BetaBannerVisible(new Date(2026, 10, 1))).toBe(false);
    });
});
