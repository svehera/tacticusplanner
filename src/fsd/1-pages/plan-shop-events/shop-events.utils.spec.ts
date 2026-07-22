import { describe, expect, it } from 'vitest';

import { shopEvents } from '@/fsd/4-entities/shops';

import { rewardInfo } from './shop-events.utils';

function parseType(rewardOrFreeOffer: string): string {
    return rewardOrFreeOffer.split(':')[0];
}

describe('shop-events rewardInfo coverage', () => {
    it('every reward/freeOffer type across all shop events resolves to a real icon/label', () => {
        const types = new Set<string>();
        for (const event of shopEvents) {
            for (const week of event.weeks) {
                for (const slot of week.products) {
                    for (const variant of slot) {
                        types.add(parseType(variant.reward));
                        if (variant.freeOffer) types.add(parseType(variant.freeOffer));
                    }
                }
            }
        }

        expect(types.size).toBeGreaterThan(0);

        // rewardInfo's fallback branch is the only path that sets label === the raw type string,
        // so this catches both "no branch matches this type" and "branch matched but the
        // referenced character/upgrade/equipment id wasn't found in its data source".
        const unresolved: string[] = [];
        for (const type of types) {
            const { label } = rewardInfo(`${type}:1`);
            if (label === type) unresolved.push(type);
        }

        expect(unresolved, `Reward types with no icon/label:\n${unresolved.join('\n')}`).toHaveLength(0);
    });
});
