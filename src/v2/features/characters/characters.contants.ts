import { ICharacter2 } from 'src/models/interfaces';
import { Rank, Rarity, RarityStars } from 'src/models/enums';
import { IRarityCap } from 'src/v2/features/characters/characters.models';

export const unsetCharacter: Partial<ICharacter2> = {
    name: 'Unset',
    icon: 'unset.webp',
    rank: Rank.Stone1,
    upgrades: [],
    stars: RarityStars.None,
    rarity: Rarity.Common,
    level: 1,
};

export const rarityCaps: Record<Rarity, IRarityCap> = {
    [Rarity.Common]: {
        rarity: Rarity.Common,
        abilitiesLevel: 8,
        rank: Rank.Iron1,
        stars: RarityStars.TwoStars,
    },
    [Rarity.Uncommon]: {
        rarity: Rarity.Uncommon,
        abilitiesLevel: 17,
        rank: Rank.Bronze1,
        stars: RarityStars.FourStars,
    },
    [Rarity.Rare]: {
        rarity: Rarity.Rare,
        abilitiesLevel: 26,
        rank: Rank.Silver1,
        stars: RarityStars.RedOneStar,
    },
    [Rarity.Epic]: {
        rarity: Rarity.Epic,
        abilitiesLevel: 35,
        rank: Rank.Gold1,
        stars: RarityStars.RedThreeStars,
    },
    [Rarity.Legendary]: {
        rarity: Rarity.Legendary,
        abilitiesLevel: 50,
        rank: Rank.Diamond3,
        stars: RarityStars.BlueStar,
    },
};
