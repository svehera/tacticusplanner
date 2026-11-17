import { afterEach, describe, expect, it, vi } from 'vitest';

import { dismissV2BetaBanner, isV2BetaBannerVisible } from './v2-beta-banner';

const day = 24 * 60 * 60 * 1000;
const dismissedAt = new Date(2026, 11, 1).getTime();

describe('V2 beta banner', () => {
    afterEach(() => {
        vi.mocked(localStorage.getItem).mockReset();
        vi.mocked(localStorage.setItem).mockReset();
    });

    it('shows when it was never dismissed', () => {
        expect(isV2BetaBannerVisible(dismissedAt)).toBe(true);
    });

    it('stores the dismissal time', () => {
        dismissV2BetaBanner(dismissedAt);
        expect(localStorage.setItem).toHaveBeenCalledWith('home-v2-beta-banner-dismissed', String(dismissedAt));
    });

    it('stays hidden for 7 days after a dismissal, then shows again', () => {
        vi.mocked(localStorage.getItem).mockReturnValue(String(dismissedAt));

        expect(isV2BetaBannerVisible(dismissedAt + 7 * day - 1)).toBe(false);
        expect(isV2BetaBannerVisible(dismissedAt + 7 * day)).toBe(true);
    });

    it('shows again for players who dismissed it before dismissals expired', () => {
        vi.mocked(localStorage.getItem).mockReturnValue('true');
        expect(isV2BetaBannerVisible(dismissedAt)).toBe(true);
    });
});
