import { ICharacter2 } from 'src/models/interfaces';

import xpData from 'src/v2/data/xp.json';

type IXpLevel = {
    level: number;
    xpToNextLevel: number;
    totalXp: number;
};

interface IXpEstimate {
    legendaryBooks: number;
    gold: number;
    currentLevel: number;
    targetLevel: number;
    xpLeft: number;
}

export class CharactersXpService {
    static readonly legendaryTomeXp = 12500 as const;
    static readonly legendaryTomeApplyCost = 500 as const;
    static xpLevelThresholds: IXpLevel[] = xpData.xpLevelThresholds;

    static getLegendaryTomesCount(character: ICharacter2, targetLevel: number): IXpEstimate | null {
        if (character.level === 50 || targetLevel > 50 || targetLevel < 2 || character.level === targetLevel) {
            return null;
        }

        const currentLevelTotalXp = this.xpLevelThresholds.find(x => x.level === character.level - 1);
        const targetLevelTotalXp = this.xpLevelThresholds.find(x => x.level === targetLevel - 1);

        if (!currentLevelTotalXp || !targetLevelTotalXp) {
            return null;
        }

        const xpLeft = targetLevelTotalXp.totalXp - currentLevelTotalXp.totalXp - character.xp;

        if (xpLeft <= 0) {
            return null;
        }

        const legendaryBooks = Math.ceil(xpLeft / this.legendaryTomeXp);

        return {
            xpLeft,
            legendaryBooks,
            currentLevel: character.level,
            targetLevel: targetLevel,
            gold: legendaryBooks * this.legendaryTomeApplyCost,
        };
    }
}
