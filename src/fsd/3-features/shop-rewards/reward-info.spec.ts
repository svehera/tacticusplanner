import { describe, expect, it } from 'vitest';

import { crusadeShopData, guildShopData, rogueTraderData, shopEvents, warShopData } from '@/fsd/4-entities/shops';

import { rewardInfo } from './reward-info';

function parseType(rewardOrFreeOffer: string): string {
    return rewardOrFreeOffer.split(':')[0];
}

/**
 * The Crusade Shop's slot4/5/6 equipment-tier variants use a `lockId` vocabulary
 * (`lock_crusade_shop_slot4_relic`, etc.) that `lockIsActive` doesn't recognize, so
 * `resolveShopForDay` hides these products unconditionally — they can never actually be
 * resolved/rendered by any consumer. Their generic `items{Rarity}_I_{Type}` reward pools are
 * excluded here rather than given fake icon support for content nobody can see.
 */
function isHiddenByUnsupportedLock(record: Record<string, unknown>): boolean {
    const conditions = record.conditions;
    if (conditions === null || typeof conditions !== 'object') return false;
    const lockId = (conditions as Record<string, unknown>).lockId;
    return typeof lockId === 'string' && /^lock_crusade_shop_slot[456]_/.test(lockId);
}

/** Recursively collects every `reward`/`freeOffer` type string found anywhere in a shop data structure. */
function collectRewardTypes(value: unknown, found: Set<string>): void {
    if (Array.isArray(value)) {
        for (const item of value) collectRewardTypes(item, found);
        return;
    }
    if (value === null || typeof value !== 'object') return;

    const record = value as Record<string, unknown>;
    if (!isHiddenByUnsupportedLock(record)) {
        if (typeof record.reward === 'string') found.add(parseType(record.reward));
        if (typeof record.freeOffer === 'string') found.add(parseType(record.freeOffer));
    }
    for (const nested of Object.values(record)) collectRewardTypes(nested, found);
}

describe('rewardInfo', () => {
    it('every reward/freeOffer type across all shops resolves to a real icon/label', () => {
        const types = new Set<string>();
        for (const shop of [warShopData, guildShopData, crusadeShopData, rogueTraderData, shopEvents]) {
            collectRewardTypes(shop, types);
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
