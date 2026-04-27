import { describe, it, expect, vi } from 'vitest';

import { Rarity, Alliance } from '@/fsd/5-shared/model';

import { OnslaughtRewardsService, OnslaughtData } from './onslaught-rewards-service';

describe('OnslaughtRewardsService', () => {
    const mockData: OnslaughtData = {
        honorYourHeroesRewards: [
            {
                tier: 1,
                maxProgressionIndex: 3, // Eligible for Common+
                rewards: ['shards_hero:2-4', 'mythicshards_hero:1'],
            },
            {
                tier: 1,
                maxProgressionIndex: 10, // Eligible for Rare+
                rewards: ['shards_hero:5'],
            },
            {
                tier: 1,
                maxProgressionIndex: 15, // Eligible for Legendary+
                rewards: ['shards_hero:10%8/10'], // Mean: 8
            },
            {
                tier: 2,
                maxProgressionIndex: 3,
                rewards: ['shards_hero:20'],
            },
        ],
    };

    describe('getAllianceSector', () => {
        it('should return the sector from preferences if it exists', () => {
            const preferences = { onslaughtSectors: { [Alliance.Imperial]: 5 } };
            expect(OnslaughtRewardsService.getAllianceSector(preferences, Alliance.Imperial)).toBe(5);
        });

        it('should return 1 as default if preference or alliance is missing', () => {
            expect(OnslaughtRewardsService.getAllianceSector({}, Alliance.Xenos)).toBe(1);
            expect(OnslaughtRewardsService.getAllianceSector(undefined, Alliance.Chaos)).toBe(1);
        });
    });

    describe('getMeanShards', () => {
        it('should return 0 if data is undefined', () => {
            // Suppress console.warn for cleaner test output
            const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
            expect(OnslaughtRewardsService.getMeanShards(undefined, 1)).toBe(0);
            warnSpy.mockRestore();
        });

        it('should correctly filter rewards by TierId', () => {
            // Tier 2 has only one eligible reward for Common: 20 shards
            const result = OnslaughtRewardsService.getMeanShards(mockData, 2, Rarity.Common, 'shards');
            expect(result).toBe(20);
        });

        it('should calculate mean for Range rewards (e.g., "2-4" -> 3)', () => {
            // Tier 1, Common (limit 3). Reward "shards_hero:2-4" -> Mean 3.
            const result = OnslaughtRewardsService.getMeanShards(mockData, 1, Rarity.Common, 'shards');
            expect(result).toBe(3);
        });

        it('should correctly filter rewards based on Hero Rarity (Rare)', () => {
            // Rare limit is index 11.
            // Highest eligible is index 10 (Fixed 5).
            const result = OnslaughtRewardsService.getMeanShards(mockData, 1, Rarity.Rare, 'shards');
            expect(result).toBe(5);
        });

        it('should calculate mean for Probability rewards (e.g., "10%8/10" -> 8)', () => {
            // Legendary limit is index 18.
            // Highest eligible is index 15. Reward "shards_hero:10%8/10" -> Mean 8.
            const result = OnslaughtRewardsService.getMeanShards(mockData, 1, Rarity.Legendary, 'shards');
            expect(result).toBe(8);
        });

        it('should calculate Mythic Shards separately from standard Shards', () => {
            // Only index 3 has "mythicshards_hero:1"
            const result = OnslaughtRewardsService.getMeanShards(mockData, 1, Rarity.Legendary, 'mythicShards');
            expect(result).toBe(1);
        });

        it('should handle complex reward strings like "shards_hero:100%1/10"', () => {
            const complexData: OnslaughtData = {
                honorYourHeroesRewards: [{ tier: 1, maxProgressionIndex: 3, rewards: ['shards_hero:100%1/10'] }],
            };
            // 100 * 0.1 = 10
            expect(OnslaughtRewardsService.getMeanShards(complexData, 1, Rarity.Common)).toBe(10);
        });

        it('should return only the highest eligible milestone (non-cumulative)', () => {
            const multiMilestoneData: OnslaughtData = {
                honorYourHeroesRewards: [
                    { tier: 17, maxProgressionIndex: 1, rewards: ['shards_hero:12-14'] }, // Mean 13
                    { tier: 17, maxProgressionIndex: 7, rewards: ['shards_hero:15-18'] }, // Mean 16.5
                    { tier: 17, maxProgressionIndex: 14, rewards: ['shards_hero:18-22'] }, // Mean 20
                ],
            };

            // Legendary limit is 18. Highest eligible is Index 14.
            const result = OnslaughtRewardsService.getMeanShards(multiMilestoneData, 17, Rarity.Legendary);
            expect(result).toBe(20);

            // Uncommon limit is 7. Highest eligible is Index 7.
            const resultUncommon = OnslaughtRewardsService.getMeanShards(multiMilestoneData, 17, Rarity.Uncommon);
            expect(resultUncommon).toBe(17); // Round(16.5)
        });
    });
});
