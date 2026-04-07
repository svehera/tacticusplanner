// eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import xpData from 'src/data/xp.json';

import { mutableCopy } from '@/fsd/5-shared/lib';
import { Rarity } from '@/fsd/5-shared/model';

// eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { IXpEstimate, IXpLevel } from '@/fsd/3-features/characters/characters.models';

export class CharactersXpService {
    static readonly legendaryTomeXp = 12_500 as const;
    static readonly legendaryTomeApplyCost = 500 as const;
    static xpLevelThresholds = mutableCopy(xpData.xpLevelThresholds) satisfies IXpLevel[];

    static getLegendaryTomesCount(
        currentLevel: number,
        currentXp: number,
        targetLevel: number
    ): IXpEstimate | undefined {
        if (
            currentLevel === this.xpLevelThresholds.length ||
            targetLevel > this.xpLevelThresholds.length ||
            targetLevel < 2 ||
            currentLevel >= targetLevel
        ) {
            return;
        }

        const currentLevelTotalXp = this.xpLevelThresholds.find(x => x.level === currentLevel - 1);
        const targetLevelTotalXp = this.xpLevelThresholds.find(x => x.level === targetLevel - 1);

        if (!currentLevelTotalXp || !targetLevelTotalXp) {
            return;
        }

        const xpLeft = targetLevelTotalXp.totalXp - currentLevelTotalXp.totalXp - currentXp;

        if (xpLeft <= 0) {
            return;
        }

        const legendaryBooks = Math.ceil(xpLeft / this.legendaryTomeXp);

        return {
            xpLeft,
            books: legendaryBooks,
            bookRarity: Rarity.Legendary,
            currentLevel: currentLevel,
            targetLevel: targetLevel,
            gold: legendaryBooks * this.legendaryTomeApplyCost,
        };
    }
}
