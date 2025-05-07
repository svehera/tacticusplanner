import xpData from 'src/v2/data/xp.json';

import { RarityStars, Rarity } from '@/fsd/5-shared/model';

import { Rank } from '@/fsd/4-entities/character';

import { IXpLevel } from 'src/v2/features/characters/characters.models';
import { UpgradesService } from 'src/v2/features/goals/upgrades.service';
import { TacticusUpgrade } from 'src/v2/features/tacticus-integration/tacticus-integration.models';

export class TacticusIntegrationService {
    static convertProgressionIndex(progressionIndex: number): [Rarity, RarityStars] {
        if (progressionIndex < 0 || progressionIndex > 15) {
            throw new Error('Invalid progression index');
        }

        const rarityThresholds = [0, 3, 6, 9, 12];
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

    static convertUpgrades(unitName: string, rank: Rank, upgradesIndexes: number[]): string[] {
        const [rankUp] = UpgradesService.getCharacterUpgradeRank({
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
        return UpgradesService.findUpgrade(upgrade);
    }
}
