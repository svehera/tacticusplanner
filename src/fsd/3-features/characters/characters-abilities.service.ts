import { groupBy, mapValues, sum } from 'lodash';

// eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import abilitiesLvlUpJson from 'src/data/characters-lvl-up-abilities.json';
// eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import xpData from 'src/data/xp.json';

import { Rarity, Alliance } from '@/fsd/5-shared/model';

import {
    ICharacterAbilitiesMaterialsTotal,
    ICharacterAbilityLevel,
    ICharacterAbilityLevelRaw,
    IXpLevel,
    // eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
} from '@/fsd/3-features/characters/characters.models';

export class CharactersAbilitiesService {
    private static abilitiesLvlUpRaw: ICharacterAbilityLevelRaw[] = abilitiesLvlUpJson;
    private static abilitiesLvlUp: ICharacterAbilityLevel[] = this.abilitiesLvlUpRaw.map(x => ({
        ...x,
        rarity: this.getRarityFromLevel(x.lvl + 1),
    }));
    static readonly legendaryTomeXp = 12500 as const;
    static readonly legendaryTomeApplyCost = 500 as const;
    static xpLevelThresholds: IXpLevel[] = xpData.xpLevelThresholds;

    public static getMaximumAbilityLevel(): number {
        return this.abilitiesLvlUpRaw.length + 1;
    }

    public static getMaterials(levelStart: number, levelEnd: number): ICharacterAbilityLevel[] {
        return this.abilitiesLvlUp.slice(Math.max(levelStart, 1) - 1, Math.max(levelEnd, 1) - 1);
    }

    public static getTotals(
        materials: ICharacterAbilityLevel[],
        alliance: Alliance
    ): ICharacterAbilitiesMaterialsTotal {
        const gold = sum(materials.map(x => x.gold));

        const badges = mapValues(groupBy(materials, 'rarity'), x => sum(x.map(y => y.badges))) as Record<
            Rarity,
            number
        >;

        return {
            alliance,
            gold,
            badges,
        };
    }

    private static getRarityFromLevel(level: number): Rarity {
        if (level <= 8) {
            return Rarity.Common;
        }

        if (level <= 17) {
            return Rarity.Uncommon;
        }

        if (level <= 26) {
            return Rarity.Rare;
        }

        if (level <= 35) {
            return Rarity.Epic;
        }
        if (level <= 50) {
            return Rarity.Legendary;
        }

        return Rarity.Mythic;
    }
}
