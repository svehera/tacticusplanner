import { describe, it, expect } from 'vitest';

import { Alliance, Rarity, RarityStars } from '@/fsd/5-shared/model';

import {
    formatOnslaughtRewardRange,
    getOnslaughtReward,
    getOnslaughtRewardForCharacter,
    defaultOnslaughtPreferences,
} from './onslaught-rewards';

// Helpers
const stone1 = { sector: 'stone', tier: 1 } as const;
const adamantine3 = { sector: 'adamantine', tier: 3 } as const;

describe('getOnslaughtReward', () => {
    describe('regular shard buckets', () => {
        it('Legendary (no blue star) returns regular shards', () => {
            const reward = getOnslaughtReward(Rarity.Legendary, RarityStars.None, stone1.sector, stone1.tier);
            expect(reward.isMythic).toBe(false);
        });

        it('Epic returns regular shards', () => {
            const reward = getOnslaughtReward(Rarity.Epic, RarityStars.None, stone1.sector, stone1.tier);
            expect(reward.isMythic).toBe(false);
        });
    });

    describe('mythic shard buckets', () => {
        it('Legendary + OneBlueStar returns mythic shards (legendaryBlue bucket)', () => {
            const reward = getOnslaughtReward(Rarity.Legendary, RarityStars.OneBlueStar, stone1.sector, stone1.tier);
            expect(reward.isMythic).toBe(true);
        });

        it('Mythic returns mythic shards (mythicShards bucket)', () => {
            const reward = getOnslaughtReward(Rarity.Mythic, RarityStars.None, stone1.sector, stone1.tier);
            expect(reward.isMythic).toBe(true);
        });
    });

    describe('cross-boundary: Legendary 0-stars vs Legendary OneBlueStar produce DIFFERENT results', () => {
        it('Legendary no-star gives regular shards, not mythic', () => {
            const reward = getOnslaughtReward(Rarity.Legendary, RarityStars.None, adamantine3.sector, adamantine3.tier);
            expect(reward.isMythic).toBe(false);
        });

        it('Legendary OneBlueStar gives mythic shards', () => {
            const reward = getOnslaughtReward(
                Rarity.Legendary,
                RarityStars.OneBlueStar,
                adamantine3.sector,
                adamantine3.tier
            );
            expect(reward.isMythic).toBe(true);
        });

        it('using Legendary no-star incorrectly for the mythic-shards label gives the wrong (regular) bucket', () => {
            const wrongReward = getOnslaughtReward(
                Rarity.Legendary,
                RarityStars.None,
                adamantine3.sector,
                adamantine3.tier
            );
            const correctReward = getOnslaughtReward(
                Rarity.Legendary,
                RarityStars.OneBlueStar,
                adamantine3.sector,
                adamantine3.tier
            );
            // isMythic differs: wrong is regular shards, correct is mythic shards
            expect(wrongReward.isMythic).toBe(false);
            expect(correctReward.isMythic).toBe(true);
        });
    });
});

describe('formatOnslaughtRewardRange', () => {
    it('regular shards has no "mythic" suffix', () => {
        const label = formatOnslaughtRewardRange(Rarity.Legendary, RarityStars.None, stone1.sector, stone1.tier);
        expect(label).not.toContain('mythic');
    });

    it('legendaryBlue shards include "mythic" suffix', () => {
        const label = formatOnslaughtRewardRange(Rarity.Legendary, RarityStars.OneBlueStar, stone1.sector, stone1.tier);
        expect(label).toContain('mythic');
    });

    it('Mythic shards include "mythic" suffix', () => {
        const label = formatOnslaughtRewardRange(Rarity.Mythic, RarityStars.None, stone1.sector, stone1.tier);
        expect(label).toContain('mythic');
    });

    describe('adamantine tier 3 — legendaryBlue and mythicShards are distinct', () => {
        it('legendaryBlue is 1-2 mythic', () => {
            const label = formatOnslaughtRewardRange(
                Rarity.Legendary,
                RarityStars.OneBlueStar,
                adamantine3.sector,
                adamantine3.tier
            );
            expect(label).toBe('1-2 mythic');
        });

        it('mythicShards is 2-3 mythic', () => {
            const label = formatOnslaughtRewardRange(
                Rarity.Mythic,
                RarityStars.None,
                adamantine3.sector,
                adamantine3.tier
            );
            expect(label).toBe('2-3 mythic');
        });
    });
});

describe('cross-boundary ascension goal: mythic shard rate selection', () => {
    /**
     * For a goal starting at Legendary (below OneBlueStar) targeting Mythic, the UI should
     * display the mythic shard rate using Legendary+OneBlueStar params (not the current 0-star
     * params), because that is when mythic shard farming begins.
     */
    it('using OneBlueStar threshold gives mythic rate for a cross-boundary goal', () => {
        const currentRarity = Rarity.Legendary;
        const currentStars = RarityStars.None; // below threshold

        // The fix: when currentStars < OneBlueStar, clamp up to OneBlueStar for the mythic label
        const mythicRarity = currentStars >= RarityStars.OneBlueStar ? currentRarity : Rarity.Legendary;
        const mythicStars = Math.max(currentStars, RarityStars.OneBlueStar);

        const label = formatOnslaughtRewardRange(mythicRarity, mythicStars, adamantine3.sector, adamantine3.tier);
        expect(label).toContain('mythic');
        expect(label).toBe('1-2 mythic');
    });

    it('already-at-OneBlueStar character passes through unchanged', () => {
        const currentRarity = Rarity.Legendary;
        const currentStars = RarityStars.OneBlueStar;

        const mythicRarity = currentStars >= RarityStars.OneBlueStar ? currentRarity : Rarity.Legendary;
        const mythicStars = Math.max(currentStars, RarityStars.OneBlueStar);

        expect(mythicRarity).toBe(Rarity.Legendary);
        expect(mythicStars).toBe(RarityStars.OneBlueStar);
        const label = formatOnslaughtRewardRange(mythicRarity, mythicStars, adamantine3.sector, adamantine3.tier);
        expect(label).toContain('mythic');
    });

    it('already-Mythic character uses Mythic params unchanged', () => {
        const currentRarity = Rarity.Mythic;
        const currentStars = RarityStars.OneBlueStar;

        const mythicRarity = currentStars >= RarityStars.OneBlueStar ? currentRarity : Rarity.Legendary;
        const mythicStars = Math.max(currentStars, RarityStars.OneBlueStar);

        expect(mythicRarity).toBe(Rarity.Mythic);
        const label = formatOnslaughtRewardRange(mythicRarity, mythicStars, adamantine3.sector, adamantine3.tier);
        expect(label).toContain('mythic');
        expect(label).toBe('2-3 mythic'); // mythicShards bucket in adamantine T3
    });
});

describe('getOnslaughtRewardForCharacter', () => {
    it('uses alliance preferences to look up reward', () => {
        const prefs = {
            ...defaultOnslaughtPreferences,
            [Alliance.Imperial]: { sector: 'adamantine' as const, tier: 3 as const },
        };

        const reward = getOnslaughtRewardForCharacter(Rarity.Mythic, RarityStars.None, Alliance.Imperial, prefs);
        expect(reward.isMythic).toBe(true);
        expect(reward.min).toBe(2);
        expect(reward.max).toBe(3);
    });
});
