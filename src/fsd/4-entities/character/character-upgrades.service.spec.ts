import { describe, it, expect } from 'vitest';

import { Rank } from '@/fsd/5-shared/model';

import { CharacterUpgradesService } from './character-upgrades.service';
import { rankUpData } from './data';

describe('CharacterUpgradesService', () => {
    const danteRankUpData = rankUpData['bloodDante']!;

    describe('getCharacterUpgradeRank', () => {
        it('should return upgrades for a single full rank up', () => {
            const result = CharacterUpgradesService.getCharacterUpgradeRank({
                unitId: 'bloodDante',
                unitName: 'Dante',
                rankStart: Rank.Stone1,
                rankEnd: Rank.Stone2,
                rankPoint5: false,
                rankStartPoint5: false,
                appliedUpgrades: [],
                upgradesRarity: [],
            });

            expect(result).toHaveLength(1);
            expect(result[0].upgrades).toEqual(danteRankUpData['Stone I']);
            expect(result[0].rankStart).toBe(Rank.Stone1);
            expect(result[0].rankEnd).toBe(Rank.Stone2);
        });

        it('should return upgrades for multiple ranks', () => {
            const result = CharacterUpgradesService.getCharacterUpgradeRank({
                unitId: 'bloodDante',
                unitName: 'Dante',
                rankStart: Rank.Silver1,
                rankEnd: Rank.Silver3,
                rankPoint5: false,
                rankStartPoint5: false,
                appliedUpgrades: [],
                upgradesRarity: [],
            });

            expect(result).toHaveLength(2);
            expect(result[0].upgrades).toEqual(danteRankUpData['Silver I']);
            expect(result[1].upgrades).toEqual(danteRankUpData['Silver II']);
        });

        it('should handle starting from a .5 rank', () => {
            const result = CharacterUpgradesService.getCharacterUpgradeRank({
                unitId: 'bloodDante',
                unitName: 'Dante',
                rankStart: Rank.Silver1,
                rankEnd: Rank.Silver2,
                rankPoint5: false,
                rankStartPoint5: true,
                appliedUpgrades: [],
                upgradesRarity: [],
            });

            expect(result).toHaveLength(1);
            expect(result[0].upgrades).toEqual(danteRankUpData['Silver I'].filter((_, index) => (index + 1) % 2 === 0));
            expect(result[0].startRankPoint5).toBe(true);
        });

        it('should handle ending at a .5 rank', () => {
            const result = CharacterUpgradesService.getCharacterUpgradeRank({
                unitId: 'bloodDante',
                unitName: 'Dante',
                rankStart: Rank.Silver1,
                rankEnd: Rank.Silver2,
                rankPoint5: true,
                rankStartPoint5: false,
                appliedUpgrades: [],
                upgradesRarity: [],
            });

            expect(result).toHaveLength(2);
            expect(result[0].upgrades).toEqual(danteRankUpData['Silver I']);
            expect(result[1].upgrades).toEqual(
                danteRankUpData['Silver II'].filter((_, index) => (index + 1) % 2 !== 0)
            );
            expect(result[1].rankPoint5).toBe(true);
        });
        it('should handle starting from .5 and ending at .5 across multiple ranks', () => {
            const result = CharacterUpgradesService.getCharacterUpgradeRank({
                unitId: 'bloodDante',
                unitName: 'Dante',
                rankStart: Rank.Silver1,
                rankEnd: Rank.Silver3,
                rankPoint5: true,
                rankStartPoint5: true,
                appliedUpgrades: [],
                upgradesRarity: [],
            });

            expect(result).toHaveLength(3);
            // Rank 1 (.5) -> bottom row
            expect(result[0].upgrades).toEqual(danteRankUpData['Silver I'].filter((_, index) => (index + 1) % 2 === 0));
            // Rank 2 (full) -> all
            expect(result[1].upgrades).toEqual(danteRankUpData['Silver II']);
            // Rank 3 (.5) -> top row
            expect(result[2].upgrades).toEqual(
                danteRankUpData['Silver III'].filter((_, index) => (index + 1) % 2 !== 0)
            );
        });

        it('should filter out applied upgrades from the first rank', () => {
            const result = CharacterUpgradesService.getCharacterUpgradeRank({
                unitId: 'bloodDante',
                unitName: 'Dante',
                rankStart: Rank.Silver1,
                rankEnd: Rank.Silver3,
                rankPoint5: false,
                rankStartPoint5: false,
                appliedUpgrades: [danteRankUpData['Silver I'][0], danteRankUpData['Silver I'][2]],
                upgradesRarity: [],
            });

            expect(result).toHaveLength(2);
            expect(result[0].upgrades).toEqual(
                danteRankUpData['Silver I'].filter((_, index) => index !== 0 && index !== 2)
            );
            expect(result[1].upgrades).toEqual(danteRankUpData['Silver II']);
        });

        it('should filter applied upgrades when starting from a .5 rank', () => {
            const result = CharacterUpgradesService.getCharacterUpgradeRank({
                unitId: 'bloodDante',
                unitName: 'Dante',
                rankStart: Rank.Silver1,
                rankEnd: Rank.Silver2,
                rankPoint5: false,
                rankStartPoint5: true,
                appliedUpgrades: [danteRankUpData['Silver I'][1]],
                upgradesRarity: [],
            });

            expect(result).toHaveLength(1);
            expect(result[0].upgrades).toEqual(
                danteRankUpData['Silver I'].filter((_, index) => index % 2 !== 0 && index !== 1)
            );
        });

        it('should return an empty array if character data does not exist', () => {
            const result = CharacterUpgradesService.getCharacterUpgradeRank({
                unitId: 'non-existent-char',
                unitName: 'Non Existent Char',
                rankStart: Rank.Stone1,
                rankEnd: Rank.Stone2,
                rankPoint5: false,
                rankStartPoint5: false,
                appliedUpgrades: [],
                upgradesRarity: [],
            });

            expect(result[0].upgrades).toEqual([]);
        });

        it('should return an empty array if rankStart is greater than or equal to rankEnd', () => {
            const result = CharacterUpgradesService.getCharacterUpgradeRank({
                unitId: 'bloodDante',
                unitName: 'Dante',
                rankStart: Rank.Stone2,
                rankEnd: Rank.Stone2,
                rankPoint5: false,
                rankStartPoint5: false,
                appliedUpgrades: [],
                upgradesRarity: [],
            });

            expect(result).toEqual([]);
        });

        it('should handle a single rank up from .5 to full', () => {
            const result = CharacterUpgradesService.getCharacterUpgradeRank({
                unitId: 'bloodDante',
                unitName: 'Dante',
                rankStart: Rank.Silver2,
                rankEnd: Rank.Silver3,
                rankPoint5: false,
                rankStartPoint5: true,
                appliedUpgrades: [],
                upgradesRarity: [],
            });

            expect(result).toHaveLength(1);
            expect(result[0].upgrades).toEqual(
                danteRankUpData['Silver II'].filter((_, index) => (index + 1) % 2 === 0)
            );
            expect(result[0].rankStart).toBe(Rank.Silver2);
            expect(result[0].rankEnd).toBe(Rank.Silver3);
            expect(result[0].startRankPoint5).toBe(true);
        });

        it('should handle a single rank up from full to .5', () => {
            const result = CharacterUpgradesService.getCharacterUpgradeRank({
                unitId: 'bloodDante',
                unitName: 'Dante',
                rankStart: Rank.Silver2,
                rankEnd: Rank.Silver2,
                rankPoint5: true,
                rankStartPoint5: false,
                appliedUpgrades: [],
                upgradesRarity: [],
            });

            expect(result).toHaveLength(1);
            expect(result[0].upgrades).toEqual(
                danteRankUpData['Silver II'].filter((_, index) => (index + 1) % 2 !== 0)
            );
            expect(result[0].rankStart).toBe(Rank.Silver2);
            expect(result[0].rankEnd).toBe(Rank.Silver2);
            expect(result[0].rankPoint5).toBe(true);
        });
    });
});
