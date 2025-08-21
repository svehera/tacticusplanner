import xpData from 'src/v2/data/xp.json';

import { TacticusUpgrade } from '@/fsd/5-shared/lib/tacticus-api';
import { RarityStars, Rarity, Rank } from '@/fsd/5-shared/model';

import { CharacterUpgradesService } from '@/fsd/4-entities/character';

import { IXpLevel } from 'src/v2/features/characters/characters.models';
import { UpgradesService } from 'src/v2/features/goals/upgrades.service';

export class TacticusIntegrationService {
    static convertProgressionIndex(progressionIndex: number): [Rarity, RarityStars] {
        const maxSupportedIndex = 18;
        if (progressionIndex < 0) {
            console.error(`API returned invalid progressionIndex ${progressionIndex}, setting to 0 (Common No Stars)`);
            progressionIndex = 0;
        }
        if (progressionIndex > maxSupportedIndex) {
            console.warn(
                `API returned unsupported progressionIndex ${progressionIndex}, setting to ${maxSupportedIndex}`
            );
        }

        const rarityThresholds = [0, 3, 6, 9, 12, 16];
        let rarity: Rarity = Rarity.Common;

        // We count down from rarest to most-common, so any progressionIndex values higher than maxSupportedIndex
        // will be clamped to the rarest we currently support. This is relevant to the 2025 staged rollout of Mythic
        // rarity, which adds a new rarity with 4 new ranks (but only 1 rank was released initially)
        for (let i = rarityThresholds.length - 1; i >= 0; i--) {
            if (progressionIndex >= rarityThresholds[i]) {
                rarity = i as Rarity;
                break;
            }
        }

        // As above, we clamp the rarity stars to the rarest we support. While this is inaccurate, it allows
        // the planner to absorb unsupported values in the period between their appearance in the Tacticus API,
        // and the planner adding support.
        const rarityStars: RarityStars = (maxSupportedIndex - rarity) as RarityStars;

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
