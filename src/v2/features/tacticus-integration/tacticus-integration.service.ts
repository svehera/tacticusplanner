import xpData from 'src/v2/data/xp.json';

import { TacticusUpgrade } from '@/fsd/5-shared/lib/tacticus-api';
import { RarityStars, Rarity, Rank } from '@/fsd/5-shared/model';

import { CharacterUpgradesService } from '@/fsd/4-entities/character';

import { IXpLevel } from 'src/v2/features/characters/characters.models';

// Mythic Wings
export const MAX_PROGRESSION_INDEX = 19;

export class TacticusIntegrationService {
    static convertProgressionIndex(progressionIndex: number): [Rarity, RarityStars] {
        let validatedIndex = progressionIndex;

        if (progressionIndex < 0) {
            console.warn(`API returned invalid progressionIndex ${progressionIndex}, setting to 0`);
            // Clamp negative invalid values to Common No Stars
            validatedIndex = 0;
        } else if (progressionIndex > MAX_PROGRESSION_INDEX) {
            console.warn(
                `API returned unsupported progressionIndex ${progressionIndex}, setting to ${MAX_PROGRESSION_INDEX}`
            );
            // Clamp positive invalid values to highest we handle
            validatedIndex = MAX_PROGRESSION_INDEX;
        }

        const rarityThresholds = [0, 3, 6, 9, 12, 16];
        let rarity: Rarity = Rarity.Common;

        for (let i = rarityThresholds.length - 1; i >= 0; i--) {
            if (validatedIndex >= rarityThresholds[i]) {
                rarity = i as Rarity;
                break;
            }
        }

        const rarityStars: RarityStars = (validatedIndex - rarity) as RarityStars;

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
