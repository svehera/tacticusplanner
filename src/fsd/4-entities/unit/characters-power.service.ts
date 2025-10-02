import { RarityStars, Rarity, Rank } from '@/fsd/5-shared/model';

import { IUnit } from './model';
import { isCharacter, isMow, isUnlocked } from './units.functions';

export class CharactersPowerService {
    public static getCharacterAbilityPower(unit: IUnit): number {
        if (!isUnlocked(unit)) {
            return 0;
        }

        const abilityWeight = 500000 / 41274;
        if (isCharacter(unit)) {
            const abilityPower =
                abilityWeight *
                CharactersPowerService.getRarityCoeff(unit, unit.rarity) *
                (CharactersPowerService.getAbilityCoeff(unit.activeAbilityLevel) +
                    CharactersPowerService.getAbilityCoeff(unit.passiveAbilityLevel));
            return Math.round(abilityPower);
        } else if (isMow(unit)) {
            const abilityPower =
                // MoW have abilities but no attributes.
                // Their stars and rarities scale differently than characters.
                4 *
                abilityWeight *
                (1 +
                    CharactersPowerService.getRarityCoeff(unit, unit.rarity) +
                    CharactersPowerService.getStarsCoeff(unit, unit.stars)) *
                (CharactersPowerService.getAbilityCoeff(unit.primaryAbilityLevel) +
                    CharactersPowerService.getAbilityCoeff(unit.secondaryAbilityLevel));
            return Math.round(abilityPower);
        } else {
            return 0;
        }
    }

    public static getCharacterAttributePower(unit: IUnit): number {
        if (!isUnlocked(unit) || !isCharacter(unit)) {
            return 0;
        }

        const upgradeBoost =
            (1 / 9) *
            (CharactersPowerService.getRankCoeff(unit.rank + 1) - CharactersPowerService.getRankCoeff(unit.rank));

        const attributesWeight = 3000000 / 9326;
        const attributePower =
            attributesWeight *
            CharactersPowerService.getStarsCoeff(unit, unit.stars) *
            (CharactersPowerService.getRankCoeff(unit.rank) + upgradeBoost * (unit.upgrades?.length ?? 0));

        return Math.round(attributePower);
    }
    public static getCharacterPower(unit: IUnit): number {
        if (!isUnlocked(unit)) {
            return 0;
        }
        // Leave this off as we're scaling so that 40,000 is the ultimate Power for any character.
        //      const dirtyDozenCoeff = CharactersPowerService.getDirtyDozenCoeff(character.name);
        const powerLevel =
            CharactersPowerService.getCharacterAttributePower(unit) +
            CharactersPowerService.getCharacterAbilityPower(unit);
        return Math.round(powerLevel);
    }

    public static getAbilityCoeff(level: number): number {
        if (level <= 22) {
            return level;
        } else if (level <= 39) {
            return 3.8 * (level - 22) + 22;
        } else if (level <= 40) {
            return 5.3 * (level - 39) + 86.6;
        } else if (level <= 44) {
            return 8.4 * (level - 40) + 91.9;
        } else if (level <= 50) {
            return 17.3 * (level - 44) + 125.5;
        } else {
            // Mythic values estimated via AI, unsure of source of original values
            return 35.0 * (level - 50) + 229.3;
        }
    }

    public static getRarityCoeff(unit: IUnit, rarity: Rarity): number {
        if (isCharacter(unit)) {
            switch (rarity) {
                case Rarity.Common:
                default:
                    return 1.0;
                case Rarity.Uncommon:
                    return 1.2;
                case Rarity.Rare:
                    return 1.4;
                case Rarity.Epic:
                    return 1.6;
                case Rarity.Legendary:
                    return 1.8;
                case Rarity.Mythic:
                    return 2.0;
            }
        } else if (isMow(unit)) {
            switch (rarity) {
                case Rarity.Common:
                default:
                    return 0.0;
                case Rarity.Uncommon:
                    return 0.05;
                case Rarity.Rare:
                    return 0.1;
                case Rarity.Epic:
                    return 0.15;
                case Rarity.Legendary:
                    return 0.2;
                case Rarity.Mythic:
                    return 0.25;
            }
        } else {
            return 0;
        }
    }

    public static getRankCoeff(rank: Rank): number {
        switch (rank) {
            case Rank.Stone1:
                return 1.0;
            case Rank.Stone2:
                return 1.25;
            case Rank.Stone3:
                return 1.25 ** 2;
            case Rank.Iron1:
                return 1.25 ** 3;
            case Rank.Iron2:
                return 1.25 ** 4;
            case Rank.Iron3:
                return 1.25 ** 5;
            case Rank.Bronze1:
                return 1.25 ** 6;
            case Rank.Bronze2:
                return 1.25 ** 7;
            case Rank.Bronze3:
                return 1.25 ** 8;
            case Rank.Silver1:
                return 1.25 ** 9;
            case Rank.Silver2:
                return 1.25 ** 10;
            case Rank.Silver3:
                return 1.25 ** 11;
            case Rank.Gold1:
                return 1.25 ** 12;
            case Rank.Gold2:
                return 1.25 ** 13;
            case Rank.Gold3:
                return 1.25 ** 14;
            case Rank.Diamond1:
                return 1.25 ** 15;
            case Rank.Diamond2:
                return 1.25 ** 16;
            case Rank.Diamond3:
                return 1.25 ** 17;
            case Rank.Adamantine1:
                return 1.25 ** 18;
            // Uncomment once higher Adamantine ranks are supported
            // case Rank.Adamantine2:
            //     return 1.25 ** 19;
            // case Rank.Adamantine3:
            //     return 1.25 ** 20;

            case Rank.Locked:
            default:
                return 0;
        }
    }

    public static getStarsCoeff(unit: IUnit, rank: RarityStars): number {
        if (isCharacter(unit)) {
            switch (rank) {
                case RarityStars.OneStar:
                    return 1.1;
                case RarityStars.TwoStars:
                    return 1.2;
                case RarityStars.ThreeStars:
                    return 1.3;
                case RarityStars.FourStars:
                    return 1.4;
                case RarityStars.FiveStars:
                    return 1.5;
                case RarityStars.RedOneStar:
                    return 1.6;
                case RarityStars.RedTwoStars:
                    return 1.7;
                case RarityStars.RedThreeStars:
                    return 1.8;
                case RarityStars.RedFourStars:
                    return 1.9;
                case RarityStars.RedFiveStars:
                    return 2.0;
                case RarityStars.OneBlueStar:
                    return 2.1;
                case RarityStars.TwoBlueStars:
                    return 2.2;
                case RarityStars.ThreeBlueStars:
                    return 2.3;
                case RarityStars.MythicWings:
                    return 2.4;
                case RarityStars.None:
                default:
                    return 1.0;
            }
        } else if (isMow(unit)) {
            switch (rank) {
                case RarityStars.OneStar:
                    return 0.05;
                case RarityStars.TwoStars:
                    return 0.1;
                case RarityStars.ThreeStars:
                    return 0.15;
                case RarityStars.FourStars:
                    return 0.2;
                case RarityStars.FiveStars:
                    return 0.25;
                case RarityStars.RedOneStar:
                    return 0.3;
                case RarityStars.RedTwoStars:
                    return 0.35;
                case RarityStars.RedThreeStars:
                    return 0.4;
                case RarityStars.RedFourStars:
                    return 0.45;
                case RarityStars.RedFiveStars:
                    return 0.5;
                case RarityStars.OneBlueStar:
                    return 0.6;
                case RarityStars.TwoBlueStars:
                    return 0.7;
                case RarityStars.ThreeBlueStars:
                    return 0.8;
                case RarityStars.MythicWings:
                    return 0.9;

                case RarityStars.None:
                default:
                    return 0.0;
            }
        }

        return 0;
    }
}
