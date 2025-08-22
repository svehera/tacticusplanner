import xpData from 'src/v2/data/xp.json';

import { TacticusUpgrade } from '@/fsd/5-shared/lib/tacticus-api';
import { RarityStars, Rarity, Rank } from '@/fsd/5-shared/model';

import { CharacterUpgradesService } from '@/fsd/4-entities/character';

import { IXpLevel } from 'src/v2/features/characters/characters.models';
import { UpgradesService } from 'src/v2/features/goals/upgrades.service';

export class TacticusIntegrationService {
    static convertProgressionIndex(progressionIndex: number): [Rarity, RarityStars] {
        if (progressionIndex < 0 || progressionIndex > 18) {
            throw new Error('Invalid progression index');
        }

        const rarityThresholds = [0, 3, 6, 9, 12, 16];
        let rarity: Rarity = Rarity.Common;

        for (let i = rarityThresholds.length - 1; i >= 0; i--) {
            if (progressionIndex >= rarityThresholds[i]) {
                rarity = i as Rarity;
                break;
            }
        }

        const rarityStars: RarityStars = (progressionIndex - rarity) as RarityStars;

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
