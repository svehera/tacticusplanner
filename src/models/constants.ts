import { LegendaryEventEnum, Rarity, RarityStars, RarityString } from './enums';
import { ICharacter, ICharProgression, IUnitData } from './interfaces';
import { ShadowSunLegendaryEvent } from './legendary-events';

export const rarityStringToNumber: Record<RarityString, Rarity> = {
    [RarityString.Common]: Rarity.Common,
    [RarityString.Uncommon]: Rarity.Uncommon,
    [RarityString.Rare]: Rarity.Rare,
    [RarityString.Epic]: Rarity.Epic,
    [RarityString.Legendary]: Rarity.Legendary,
};

export const rarityToStars: Record<Rarity, RarityStars> = {
    [Rarity.Common]: RarityStars.OneStar,
    [Rarity.Uncommon]: RarityStars.TwoStars,
    [Rarity.Rare]: RarityStars.FourStarts,
    [Rarity.Epic]: RarityStars.RedOneStar,
    [Rarity.Legendary]: RarityStars.RedThreeStarts,
};

export const charsProgression: Record<number, ICharProgression> = {
    [Rarity.Common + RarityStars.OneStar]: { shards: 10 },
    [Rarity.Common + RarityStars.TwoStars]: { shards: 15 },
    [Rarity.Uncommon + RarityStars.TwoStars]: { shards: 15, orbs: 10, rarity: Rarity.Uncommon },

    [Rarity.Uncommon + RarityStars.ThreeStarts]: { shards: 15 },
    [Rarity.Uncommon + RarityStars.FourStarts]: { shards: 15 },
    [Rarity.Rare + RarityStars.FourStarts]: { shards: 20, orbs: 10, rarity: Rarity.Rare },

    [Rarity.Rare + RarityStars.FiveStarts]: { shards: 30 },
    [Rarity.Rare + RarityStars.RedOneStar]: { shards: 40 },
    [Rarity.Epic + RarityStars.RedOneStar]: { shards: 50, orbs: 10, rarity: Rarity.Epic },

    [Rarity.Epic + RarityStars.RedTwoStarts]: { shards: 65 },
    [Rarity.Epic + RarityStars.RedThreeStarts]: { shards: 85 },
    [Rarity.Legendary + RarityStars.RedThreeStarts]: { shards: 100, orbs: 10, rarity: Rarity.Legendary },

    [Rarity.Legendary + RarityStars.RedFourStarts]: { shards: 65, orbs: 10, rarity: Rarity.Legendary },
    [Rarity.Legendary + RarityStars.RedFiveStarts]: { shards: 85, orbs: 15, rarity: Rarity.Legendary },
    [Rarity.Legendary + RarityStars.DiamondStar]: { shards: 100, orbs: 15, rarity: Rarity.Legendary },
};

export const charsUnlockShards: Record<Rarity, number> = {
    [Rarity.Common]: 40,
    [Rarity.Uncommon]: 80,
    [Rarity.Rare]: 130,
    [Rarity.Epic]: 250,
    [Rarity.Legendary]: 500,
};

export const defaultLE = LegendaryEventEnum.Shadowsun;
export const getDefaultLE = (characters: ICharacter[]) => new ShadowSunLegendaryEvent(characters);
export const isTabletOrMobileMediaQuery = '(max-width: 1000px)';

export const pooEmoji = String.fromCodePoint(parseInt('1F4A9', 16));
export const starEmoji = String.fromCodePoint(parseInt('1F31F', 16));