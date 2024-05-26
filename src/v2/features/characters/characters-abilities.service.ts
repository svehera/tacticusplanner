import xpData from 'src/v2/data/xp.json';
import {
    ICharacterAbilitiesMaterialsTotal,
    ICharacterAbilityLevel,
    ICharacterAbilityLevelRaw,
    IXpLevel,
} from 'src/v2/features/characters/characters.models';
import abilitiesLvlUpJson from 'src/v2/data/characters-lvl-up-abilities.json';
import { Rarity } from 'src/models/enums';
import { groupBy, mapValues, sum } from 'lodash';

export class CharactersAbilitiesService {
    private static abilitiesLvlUpRaw: ICharacterAbilityLevelRaw[] = abilitiesLvlUpJson;
    private static abilitiesLvlUp: ICharacterAbilityLevel[] = this.abilitiesLvlUpRaw.map(x => ({
        ...x,
        rarity: this.getRarityFromLevel(x.lvl + 1),
    }));
    static readonly legendaryTomeXp = 12500 as const;
    static readonly legendaryTomeApplyCost = 500 as const;
    static xpLevelThresholds: IXpLevel[] = xpData.xpLevelThresholds;

    public static getMaterials(levelStart: number, levelEnd: number): ICharacterAbilityLevel[] {
        return this.abilitiesLvlUp.slice(levelStart - 1, levelEnd - 1);
    }

    public static getTotals(materials: ICharacterAbilityLevel[]): ICharacterAbilitiesMaterialsTotal {
        const gold = sum(materials.map(x => x.gold));

        const badges = mapValues(groupBy(materials, 'rarity'), x => sum(x.map(y => y.badges))) as Record<
            Rarity,
            number
        >;

        return {
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

        return Rarity.Legendary;
    }
}
