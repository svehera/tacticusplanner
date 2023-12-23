import { ICharacter2 } from '../models/interfaces';
import { Rank, Rarity, RarityStars } from '../models/enums';

export class UtilsService {
    public static maxCharacterPower = this.getCharacterPower({
        stars: RarityStars.BlueStar,
        activeAbilityLevel: 50,
        passiveAbilityLevel: 50,
        rank: Rank.Diamond3,
        rarity: Rarity.Legendary,
    } as ICharacter2);

    public static getCharacterPower(char: ICharacter2): number {
        if (char.rank === Rank.Locked) {
            return 0;
        }

        const starsCoeff = UtilsService.getStarsCoeff(char.stars);
        const rarityCoeff = 100;
        const rankCoeff = UtilsService.getRankCoeff(char.rank);
        const activeAbilityCoeff = UtilsService.getAbilityCoeff(char.activeAbilityLevel);
        const passiveAbilityCoeff = UtilsService.getAbilityCoeff(char.passiveAbilityLevel);

        const powerLevel =
            starsCoeff * char.stars +
            rarityCoeff * char.rarity +
            rankCoeff * char.rank +
            activeAbilityCoeff * char.activeAbilityLevel +
            passiveAbilityCoeff * char.passiveAbilityLevel;

        return Math.round(powerLevel);
    }

    public static getAbilityCoeff(level: number): number {
        if (level <= 8) {
            return 20;
        } else if (level <= 17) {
            return 40;
        } else if (level <= 20) {
            return 60;
        } else if (level <= 26) {
            return 80;
        } else if (level <= 30) {
            return 150;
        } else if (level <= 35) {
            return 300;
        } else if (level <= 40) {
            return 500;
        } else if (level <= 45) {
            return 600;
        } else {
            return 700;
        }
    }

    public static getRankCoeff(rank: Rank): number {
        switch (rank) {
            case Rank.Stone1:
                return 50;
            case Rank.Stone2:
                return 75;
            case Rank.Stone3:
                return 100;
            case Rank.Iron1:
                return 150;
            case Rank.Iron2:
                return 175;
            case Rank.Iron3:
                return 200;
            case Rank.Bronze1:
                return 225;
            case Rank.Bronze2:
                return 250;
            case Rank.Bronze3:
                return 275;
            case Rank.Silver1:
                return 300;
            case Rank.Silver2:
                return 400;
            case Rank.Silver3:
                return 500;
            case Rank.Gold1:
                return 550;
            case Rank.Gold2:
                return 650;
            case Rank.Gold3:
                return 750;
            case Rank.Diamond1:
                return 800;
            case Rank.Diamond2:
                return 900;
            case Rank.Diamond3:
                return 1000;

            case Rank.Locked:
            default:
                return 0;
        }
    }

    public static getStarsCoeff(rank: RarityStars): number {
        switch (rank) {
            case RarityStars.OneStar:
                return 25;
            case RarityStars.TwoStars:
                return 50;
            case RarityStars.ThreeStars:
                return 100;
            case RarityStars.FourStars:
                return 200;
            case RarityStars.FiveStars:
                return 300;
            case RarityStars.RedOneStar:
                return 400;
            case RarityStars.RedTwoStars:
                return 500;
            case RarityStars.RedThreeStars:
                return 700;
            case RarityStars.RedFourStars:
                return 800;
            case RarityStars.RedFiveStars:
                return 900;
            case RarityStars.BlueStar:
                return 1000;

            case RarityStars.None:
            default:
                return 0;
        }
    }
}
