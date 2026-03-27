export enum RarityString {
    Common = 'Common',
    Uncommon = 'Uncommon',
    Rare = 'Rare',
    Epic = 'Epic',
    Legendary = 'Legendary',
    Mythic = 'Mythic',
}

export enum Rarity {
    Common,
    Uncommon,
    Rare,
    Epic,
    Legendary,
    Mythic,
}

export const XP_BOOK_VALUE: Record<Rarity, number> = {
    [Rarity.Common]: 20,
    [Rarity.Uncommon]: 100,
    [Rarity.Rare]: 500,
    [Rarity.Epic]: 2500,
    [Rarity.Legendary]: 12_500,
    [Rarity.Mythic]: 62_500,
};

export const XP_BOOK_ORDER: Rarity[] = Object.entries(XP_BOOK_VALUE)
    .toSorted(([, a], [, b]) => b - a)
    .map(([key]) => Number(key) as Rarity);
