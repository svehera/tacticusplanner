import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import {
    crusadeShopData,
    guildShopData,
    resolveShopSlotsPermissive,
    rogueTraderData,
    ShopData,
    ShopDayOfWeek,
    ShopLockContext,
    warShopData,
} from '@/fsd/4-entities/shops';

import { rewardInfo } from './reward-info';

const DAYS: ShopDayOfWeek[] = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

const SHOPS: Record<string, ShopData> = {
    'War Shop': warShopData as unknown as ShopData,
    'Guild Shop': guildShopData as unknown as ShopData,
    'Crusade Shop': crusadeShopData as unknown as ShopData,
    'Rogue Trader': rogueTraderData as unknown as ShopData,
};

// High power level + a permissive tier so PL/tier gating never hides a slot — this test is
// checking "can every reward this shop can ever produce be displayed", not "what's visible to a
// specific roster today".
const PL = 9999;
const LOCK_CONTEXT: ShopLockContext = { tier: 'high', starsByUnitId: {} };

/**
 * Renders `rewardInfo`'s returned icon and reports whether it actually resolved to an image-based
 * component, or fell back to plain text — either `rewardInfo`'s own unresolved-type fallback
 * (a bare `<span>`), or an inner icon component's own "couldn't find this rarity/id" fallback
 * (e.g. `ForgeBadgeImage`/`BadgeImage`'s "Invalid rarity" span). Both cases mean "can't be
 * displayed" from a user's perspective, and neither is distinguishable by inspecting `label` alone.
 */
function rendersRealIcon(rewardType: string): boolean {
    const { icon } = rewardInfo(`${rewardType}:1`);
    const { container } = render(icon);
    return container.querySelector('img') !== null;
}

describe('every shop slot can be displayed', () => {
    it('every reward type resolved by every shop/day via resolveShopSlotsPermissive renders a real icon', () => {
        const seen = new Set<string>();
        const failures: string[] = [];

        for (const [shopName, shopData] of Object.entries(SHOPS)) {
            for (const day of DAYS) {
                const slots = resolveShopSlotsPermissive(shopData, day, PL, LOCK_CONTEXT);
                for (const slot of slots) {
                    for (const item of slot.items) {
                        const key = `${shopName}:${item.rewardType}`;
                        if (seen.has(key)) continue;
                        seen.add(key);

                        if (!rendersRealIcon(item.rewardType)) {
                            failures.push(`${shopName} / ${item.rewardType}`);
                        }
                    }
                }
            }
        }

        expect(seen.size).toBeGreaterThan(0);
        expect(failures, `Reward types that failed to render a real icon:\n${failures.join('\n')}`).toHaveLength(0);
    });
});
