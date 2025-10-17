import xpData from 'src/v2/data/xp.json';

import { TacticusUpgrade } from '@/fsd/5-shared/lib/tacticus-api';
import { RarityStars, Rarity, Rank } from '@/fsd/5-shared/model';

import { CharacterUpgradesService } from '@/fsd/4-entities/character';

import { IXpLevel } from 'src/v2/features/characters/characters.models';

// Mythic Wings
export const MAX_PROGRESSION_INDEX = 19;

export class TacticusIntegrationService {
    static convertProgressionIndex(progressionIndex: number): [Rarity, RarityStars] {
        // Clamp negative indices to 0 (Common No Stars) and out-of-range positive indices to
        // highest supported level.
        const clampedIndex = Math.min(Math.max(progressionIndex, 0), MAX_PROGRESSION_INDEX);
        const rarityThresholds = [0, 3, 6, 9, 12, 16];
        let rarity: Rarity = Rarity.Common;

        // We count down from rarest to most-common, so any progressionIndex values higher than maxSupportedIndex
        // will be clamped to the rarest we currently support. This is relevant to the 2025 staged rollout of Mythic
        // rarity, which adds a new rarity with 4 new ranks (but only 1 rank was released initially)
        for (let i = rarityThresholds.length - 1; i >= 0; i--) {
            if (clampedIndex >= rarityThresholds[i]) {
                rarity = i as Rarity;
                break;
            }
        }

        const rarityStars: RarityStars = (clampedIndex - rarity) as RarityStars;

        return [rarity, rarityStars];
    }

    static convertXp(xp: number, xpLevel: number): number {
        const xpLevelThresholds: IXpLevel[] = xpData.xpLevelThresholds;
        const currLevel = xpLevelThresholds[xpLevel - 1];

        return xp - currLevel.totalXp;
    }

    static convertUpgrades(unitId: string, unitName: string, rank: Rank, upgradesIndexes: number[]): string[] {
        const [rankUp] = CharacterUpgradesService.getCharacterUpgradeRank({
            unitId,
            unitName,
            rankStart: rank,
            rankEnd: rank + 1,
            rankPoint5: false,
            upgradesRarity: [],
            appliedUpgrades: [],
        });

        if (rankUp) {
            return rankUp.upgrades.filter((_, index) => upgradesIndexes.includes(index));
        }

        return [];
    }

    static getUpgradeId(upgrade: TacticusUpgrade): string | null {
        return upgrade.id;
    }
}
