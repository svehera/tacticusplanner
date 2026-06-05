/* eslint-disable import-x/no-internal-modules */
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { Rarity, RarityStars } from '@/fsd/5-shared/model';

import { IUnit } from '@/fsd/4-entities/unit';
import { isUnlocked } from '@/fsd/4-entities/unit/units.functions';

import { CharactersService } from '@/fsd/3-features/characters/characters.service';

import { canPromoteUnit } from './can-promote';

vi.mock('@/fsd/4-entities/unit/units.functions', () => ({
    isUnlocked: vi.fn(),
}));

vi.mock('@/fsd/3-features/characters/characters.constants', () => ({
    rarityCaps: {
        [Rarity.Common]: { stars: RarityStars.TwoStars },
        [Rarity.Legendary]: { stars: RarityStars.RedFiveStars },
    },
}));

vi.mock('@/fsd/4-entities/character', () => ({
    CharactersService: {
        getTotalProgressionUntil: vi.fn(),
    },
}));

describe('canPromoteUnit', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should return false if the unit is not unlocked', () => {
        vi.mocked(isUnlocked).mockReturnValue(false);
        const unit = { rarity: Rarity.Common, stars: RarityStars.None } as IUnit;

        const result = canPromoteUnit(unit);
        expect(result).toBe(false);
    });

    it('should return false if the unit is already at the star cap for its rarity', () => {
        vi.mocked(isUnlocked).mockReturnValue(true);
        const unit = { rarity: Rarity.Common, stars: RarityStars.TwoStars } as IUnit;

        const result = canPromoteUnit(unit);
        expect(result).toBe(false);
    });

    it('should return false if the unit is beyond the star cap for its rarity', () => {
        vi.mocked(isUnlocked).mockReturnValue(true);
        const unit = { rarity: Rarity.Common, stars: RarityStars.ThreeStars } as IUnit;

        const result = canPromoteUnit(unit);
        expect(result).toBe(false);
    });

    it('should return false if the unit does not have enough shards for the next star', () => {
        vi.mocked(isUnlocked).mockReturnValue(true);
        vi.mocked(CharactersService.getTotalProgressionUntil)
            .mockReturnValueOnce({ shards: 10, mythicShards: 0 }) // Current progress
            .mockReturnValueOnce({ shards: 25, mythicShards: 0 }); // Next star requirement

        const unit = {
            rarity: Rarity.Common,
            stars: RarityStars.OneStar,
            shards: 14, // Needs 15 (25 - 10)
            mythicShards: 0,
        } as IUnit;

        const result = canPromoteUnit(unit);
        expect(result).toBe(false);
    });

    it('should return false if the unit does not have enough mythic shards for the next star', () => {
        vi.mocked(isUnlocked).mockReturnValue(true);
        vi.mocked(CharactersService.getTotalProgressionUntil)
            .mockReturnValueOnce({ shards: 100, mythicShards: 5 })
            .mockReturnValueOnce({ shards: 100, mythicShards: 15 });

        const unit = {
            rarity: Rarity.Legendary,
            stars: RarityStars.RedFourStars,
            shards: 0,
            mythicShards: 9, // Needs 10 (15 - 5)
        } as IUnit;

        const result = canPromoteUnit(unit);
        expect(result).toBe(false);
    });

    it('should return true if the unit meets both shard and mythic shard requirements', () => {
        vi.mocked(isUnlocked).mockReturnValue(true);
        vi.mocked(CharactersService.getTotalProgressionUntil)
            .mockReturnValueOnce({ shards: 100, mythicShards: 5 })
            .mockReturnValueOnce({ shards: 200, mythicShards: 15 });

        const unit = {
            rarity: Rarity.Legendary,
            stars: RarityStars.RedFourStars,
            shards: 100,
            mythicShards: 10,
        } as IUnit;

        const result = canPromoteUnit(unit);
        expect(result).toBe(true);
    });
});
