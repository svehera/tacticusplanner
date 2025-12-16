import xpData from 'src/data/xp.json';

import { IXpEstimate, IXpLevel } from '@/fsd/3-features/characters/characters.models';

export class CharactersXpService {
    static readonly legendaryTomeXp = 12500 as const;
    static readonly legendaryTomeApplyCost = 500 as const;
    static xpLevelThresholds: IXpLevel[] = xpData.xpLevelThresholds;

    static getLegendaryTomesCount(currLevel: number, currXp: number, targetLevel: number): IXpEstimate | null {
        if (
            currLevel === this.xpLevelThresholds.length ||
            targetLevel > this.xpLevelThresholds.length ||
            targetLevel < 2 ||
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
