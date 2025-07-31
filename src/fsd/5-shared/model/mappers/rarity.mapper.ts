import { RarityStars, Rarity, Rank, RarityString } from '../enums';

export class RarityMapper {
    public static toStars: Record<Rarity, RarityStars> = {
        [Rarity.Common]: RarityStars.None,
        [Rarity.Uncommon]: RarityStars.TwoStars,
        [Rarity.Rare]: RarityStars.FourStars,
        [Rarity.Epic]: RarityStars.RedOneStar,
        [Rarity.Legendary]: RarityStars.RedThreeStars,
    };

    public static toMaxStars: Record<Rarity, RarityStars> = {
        [Rarity.Common]: RarityStars.TwoStars,
        [Rarity.Uncommon]: RarityStars.FourStars,
        [Rarity.Rare]: RarityStars.RedOneStar,
        [Rarity.Epic]: RarityStars.RedThreeStars,
        [Rarity.Legendary]: RarityStars.BlueOneStar,
    };

    public static toMaxRank: Record<Rarity, Rank> = {
        [Rarity.Common]: Rank.Iron1,
        [Rarity.Uncommon]: Rank.Bronze1,
        [Rarity.Rare]: Rank.Silver1,
        [Rarity.Epic]: Rank.Gold1,
        [Rarity.Legendary]: Rank.Diamond3,
    };

    public static stringToNumber: Record<RarityString, Rarity> = {
        [RarityString.Common]: Rarity.Common,
        [RarityString.Uncommon]: Rarity.Uncommon,
        [RarityString.Rare]: Rarity.Rare,
        [RarityString.Epic]: Rarity.Epic,
        [RarityString.Legendary]: Rarity.Legendary,
    };

    public static getRarityFromLevel(level: number): Rarity {
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
