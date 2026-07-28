import { describe, expect, it } from 'vitest';

import { homescreenEvents, type HomescreenEventTier } from '@/fsd/4-entities/homescreen_events';

import { hseOfferRewardInfo, hseRewardInfo } from './hses-lookup.utils';

function collectUnresolved(
    resolve: (rewardId: string) => { resolved: boolean },
    rewardsForTier: (tier: HomescreenEventTier) => string[]
): Map<string, Set<string>> {
    const missing = new Map<string, Set<string>>();

    for (const event of homescreenEvents) {
        for (const [tierKey, tier] of Object.entries(event.tiers)) {
            if (!tier) continue;
            for (const rewardId of rewardsForTier(tier)) {
                const { resolved } = resolve(rewardId);
                if (!resolved) {
                    const key = `${event.eventName}/${tierKey}`;
                    if (!missing.has(rewardId)) missing.set(rewardId, new Set());
                    missing.get(rewardId)!.add(key);
                }
            }
        }
    }

    return missing;
}

function formatReport(missing: Map<string, Set<string>>): string {
    return [...missing.entries()]
        .map(([rewardId, locations]) => `${rewardId} (seen in: ${[...locations].join(', ')})`)
        .join('\n');
}

describe('hseRewardInfo', () => {
    it('resolves an icon for every reward offered by every HSE tier', () => {
        const missing = collectUnresolved(
            hseRewardInfo,
            tier => tier.tieredProgressRewards?.map(reward => reward.chestRewardId) ?? []
        );
        expect(missing.size, `HSE rewards with no resolvable icon:\n${formatReport(missing)}`).toBe(0);
    });
});

describe('hseOfferRewardInfo', () => {
    it('resolves every reward offered by every HSE offer', () => {
        const missing = collectUnresolved(hseOfferRewardInfo, tier =>
            Object.values(tier.offers ?? {}).flatMap(offer => offer.realMoneyProduct.rewards)
        );
        expect(missing.size, `HSE offer rewards with no resolvable icon:\n${formatReport(missing)}`).toBe(0);
    });
});
