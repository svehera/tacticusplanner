import xpData from 'src/v2/data/xp.json';

import { Rank } from '@/fsd/5-shared/model';

import { IXpEstimate, IXpLevel } from 'src/v2/features/characters/characters.models';

export class CharactersXpService {
    static readonly legendaryTomeXp = 12500 as const;
    static readonly legendaryTomeApplyCost = 500 as const;
    static xpLevelThresholds: IXpLevel[] = xpData.xpLevelThresholds;

    static getLegendaryTomesCount(currLevel: number, currXp: number, targetLevel: number): IXpEstimate | null {
        if (
            currLevel === this.xpLevelThresholds.length ||
            targetLevel > this.xpLevelThresholds.length ||
            targetLevel < Rank.Stone2 ||
            currLevel >= targetLevel
        ) {
            return null;
        }

        const currentLevelTotalXp = this.xpLevelThresholds.find(x => x.level === currLevel - 1);
        const targetLevelTotalXp = this.xpLevelThresholds.find(x => x.level === targetLevel - 1);

        if (!currentLevelTotalXp || !targetLevelTotalXp) {
            return null;
        }

        const xpLeft = targetLevelTotalXp.totalXp - currentLevelTotalXp.totalXp - currXp;

        if (xpLeft <= 0) {
            return null;
        }

        const legendaryBooks = Math.ceil(xpLeft / this.legendaryTomeXp);

        return {
            xpLeft,
            legendaryBooks,
            currentLevel: currLevel,
            targetLevel: targetLevel,
            gold: legendaryBooks * this.legendaryTomeApplyCost,
        };
    }
}
