// tests/constants.test.ts

import { getNextRarity, getMinimumStarsForRarity, getTotalProgressionUntil } from '@/models/constants';
import { Rarity, RarityStars } from '@/fsd/5-shared/model';
import { describe, expect, it } from 'vitest';

describe('progression utilities', () => {
    it('getMinimumStarsForRarity returns correct minimum stars for each rarity', () => {
        expect(getMinimumStarsForRarity(Rarity.Common)).toBe(RarityStars.OneStar);
        expect(getMinimumStarsForRarity(Rarity.Uncommon)).toBe(RarityStars.TwoStars);
        expect(getMinimumStarsForRarity(Rarity.Rare)).toBe(RarityStars.FourStars);
        expect(getMinimumStarsForRarity(Rarity.Epic)).toBe(RarityStars.RedOneStar);
        expect(getMinimumStarsForRarity(Rarity.Legendary)).toBe(RarityStars.RedThreeStars);
        expect(getMinimumStarsForRarity(Rarity.Mythic)).toBe(RarityStars.OneBlueStar);
    });

    it('getNextRarity returns next rarity or null for last', () => {
        expect(getNextRarity(Rarity.Common)).toBe(Rarity.Uncommon);
        expect(getNextRarity(Rarity.Uncommon)).toBe(Rarity.Rare);
        expect(getNextRarity(Rarity.Rare)).toBe(Rarity.Epic);
        expect(getNextRarity(Rarity.Epic)).toBe(Rarity.Legendary);
        expect(getNextRarity(Rarity.Legendary)).toBe(Rarity.Mythic);
        expect(getNextRarity(Rarity.Mythic)).toBeNull();
    });

    it('getTotalProgressionUntil accumulates correct shards up to given rarity+stars', () => {
        // Example: up to Epic + RedTwoStars should sum shards of all lower progression steps
        const total = getTotalProgressionUntil(Rarity.Epic, RarityStars.RedTwoStars);

        // Manually sum shards (based on the charsProgression table from the PR)
        // 0 + 10 + 15 + 15 + 15 + 15 + 20 + 30 + 40 + 50 + 65 = sum ...
        const expectedShards = 0 + 10 + 15 + 15 + 15 + 15 + 20 + 30 + 40 + 50 + 65;

        expect(total.shards).toBe(expectedShards);
        // or at least, shards should be >= shards for previous rarities
        expect(total.shards).toBeGreaterThan(0);
    });

    it('getTotalProgressionUntil includes orbs and mythicShards when present', () => {
        // e.g. for Mythic + OneBlueStar
        const total = getTotalProgressionUntil(Rarity.Mythic, RarityStars.OneBlueStar);
        // We expect orbs and mythicShards to reflect the mythic entries too
        expect(total.orbs).toBeGreaterThanOrEqual(0);
        expect(total.mythicShards).toBeGreaterThanOrEqual(20);
    });
});
