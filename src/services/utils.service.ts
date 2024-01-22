import { ICharacter2 } from '../models/interfaces';
import { Rank, Rarity, RarityStars } from '../models/enums';
import { StaticDataService } from './static-data.service';
import { sum } from 'lodash';

export class UtilsService {
    public static maxCharacterPower = this.getCharacterPower({
        stars: RarityStars.BlueStar,
        activeAbilityLevel: 50,
        passiveAbilityLevel: 50,
        rank: Rank.Diamond3,
        rarity: Rarity.Legendary,
    } as ICharacter2);

    public static getCharacterPower(character: ICharacter2): number {
        if (character.rank === Rank.Locked) {
            return 0;
        }

        const statsBase = 3;
        const statsWeight = 12;
        const abilityWeight = 24;

        const upgradeBoost = 0.025;

        const statsScore =
            statsBase **
            (UtilsService.getStarsCoeff(character.stars) *
                (UtilsService.getRankCoeff(character.rank) + upgradeBoost * (character.upgrades?.length ?? 0)));

        // Possible coefficient to reflect relative character usefulness by boosting power based on DirtyDozen scores:
        // dirtyDozenCoeff = 1 + (Sum_rankings – num_rankings )/100
        // Example Bellator: 1 + (3.5+5+3.5+4.5+1+4.5 - 6)/100 = 1.16
        // Characters should default rankings of "1" (dirtyDozenCoeff = 1) if not included in the dirtyDozen table.
        const dirtyDozenCoeff = UtilsService.getDirtyDozenCoeff(character.name);

        const powerLevel =
            dirtyDozenCoeff *
            (statsWeight * statsScore +
                abilityWeight *
                    (UtilsService.getAbilityCoeff(character.activeAbilityLevel) +
                        UtilsService.getAbilityCoeff(character.passiveAbilityLevel)));

        return Math.round(powerLevel);
    }

    public static getDirtyDozenCoeff(characterId: string): number {
        const dirtyDozenChar = StaticDataService.dirtyDozenData.find(x => x.Name === characterId);
        if (!dirtyDozenChar) {
            return 1;
        }
        const rankings: number[] = [
            dirtyDozenChar.Pvp,
            dirtyDozenChar.GROrk,
            dirtyDozenChar.GRMortarion,
            dirtyDozenChar.GRNecron,
            dirtyDozenChar.GRTyranid,
            dirtyDozenChar.GRScreamer,
            dirtyDozenChar.GRRogalDorn,
        ];
        return 1 + (sum(rankings) - rankings.length) / 100;
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
        } else {
            return 17.3 * (level - 44) + 125.5;
        }
    }

    public static getRankCoeff(rank: Rank): number {
        switch (rank) {
            case Rank.Stone1:
                return 1.0;
            case Rank.Stone2:
                return 1.25;
            case Rank.Stone3:
                return 1.5;
            case Rank.Iron1:
                return 1.75;
            case Rank.Iron2:
                return 2.0;
            case Rank.Iron3:
                return 2.25;
            case Rank.Bronze1:
                return 2.5;
            case Rank.Bronze2:
                return 2.75;
            case Rank.Bronze3:
                return 3.0;
            case Rank.Silver1:
                return 3.25;
            case Rank.Silver2:
                return 3.5;
            case Rank.Silver3:
                return 3.75;
            case Rank.Gold1:
                return 4.0;
            case Rank.Gold2:
                return 4.25;
            case Rank.Gold3:
                return 4.5;
            case Rank.Diamond1:
                return 4.75;
            case Rank.Diamond2:
                return 5.0;
            case Rank.Diamond3:
                return 5.25;

            case Rank.Locked:
            default:
                return 0;
        }
    }

    public static getStarsCoeff(rank: RarityStars): number {
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
            case RarityStars.BlueStar:
                return 2.1;

            case RarityStars.None:
            default:
                return 1.0;
        }
    }
}
