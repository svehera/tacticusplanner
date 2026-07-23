import { describe, expect, it } from 'vitest';

import { homescreenEvents } from '@/fsd/4-entities/homescreen_events';

import { hseRewardInfo } from './hses-lookup.utils';

describe('hseRewardInfo', () => {
    it('resolves an icon for every reward offered by every HSE tier', () => {
        const missing = new Map<string, Set<string>>();

        for (const event of homescreenEvents) {
            for (const [tierKey, tier] of Object.entries(event.tiers)) {
                for (const reward of tier?.tieredProgressRewards ?? []) {
                    const { resolved } = hseRewardInfo(reward.chestRewardId);
                    if (!resolved) {
                        const key = `${event.eventName}/${tierKey}`;
                        if (!missing.has(reward.chestRewardId)) missing.set(reward.chestRewardId, new Set());
                        missing.get(reward.chestRewardId)!.add(key);
                    }
                }
            }
        }

        const report = [...missing.entries()]
            .map(([chestRewardId, locations]) => `${chestRewardId} (seen in: ${[...locations].join(', ')})`)
            .join('\n');

        expect(missing.size, `HSE rewards with no resolvable icon:\n${report}`).toBe(0);
    });
});
