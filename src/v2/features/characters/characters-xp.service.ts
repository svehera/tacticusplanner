import xpData from 'src/v2/data/xp.json';
import { IXpEstimate, IXpLevel } from 'src/v2/features/characters/characters.models';

export class CharactersXpService {
    static readonly legendaryTomeXp = 12500 as const;
    static readonly legendaryTomeApplyCost = 500 as const;
    static readonly mythicTomeXp = 62500 as const;
    static readonly mythicTomeApplyCost = 2000 as const;
    static xpLevelThresholds: IXpLevel[] = xpData.xpLevelThresholds;

    static getMythicTomesCount(currLevel: number, currXp: number, targetLevel: number): IXpEstimate | null {
        if (currLevel === 50 || targetLevel > 50 || targetLevel < 2 || currLevel === targetLevel) {
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
        const mythicBooks = Math.ceil(xpLeft / this.mythicTomeXp);

        return {
            xpLeft,
            legendaryBooks,
            mythicBooks,
            currentLevel: currLevel,
            targetLevel: targetLevel,
            legendaryGold: legendaryBooks * this.legendaryTomeApplyCost,
            mythicGold: mythicBooks * this.mythicTomeApplyCost,
        };
    }

    static getLegendaryTomesCount(currLevel: number, currXp: number, targetLevel: number): IXpEstimate | null {
        if (currLevel === 50 || targetLevel > 50 || targetLevel < 2 || currLevel === targetLevel) {
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
        const mythicBooks = Math.ceil(xpLeft / this.mythicTomeXp);

        return {
            xpLeft,
            legendaryBooks,
            mythicBooks,
            currentLevel: currLevel,
            targetLevel: targetLevel,
            legendaryGold: legendaryBooks * this.legendaryTomeApplyCost,
            mythicGold: mythicBooks * this.mythicTomeApplyCost,
        };
    }
}
