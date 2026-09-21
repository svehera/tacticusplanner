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

/** Gold paid to apply one XP book of the given rarity. */
export const XP_BOOK_GOLD_COST: Record<Rarity, number> = {
    [Rarity.Common]: 5,
    [Rarity.Uncommon]: 15,
    [Rarity.Rare]: 50,
    [Rarity.Epic]: 150,
    [Rarity.Legendary]: 500,
    [Rarity.Mythic]: 2000,
};

export const XP_BOOK_ORDER: Rarity[] = Object.entries(XP_BOOK_VALUE)
    .toSorted(([, a], [, b]) => b - a)
    .map(([key]) => Number(key) as Rarity);

/**
 * The codex rarity to count `xp` in: the preferred codex, or the largest that fits when a single
 * preferred codex would overshoot. Smallest codex if even that overshoots — any XP costs one book.
 */
export const pickXpBookRarity = (xp: number, preferred: Rarity): Rarity => {
    if (XP_BOOK_VALUE[preferred] <= xp) return preferred;
    return XP_BOOK_ORDER.find(rarity => XP_BOOK_VALUE[rarity] <= xp) ?? XP_BOOK_ORDER.at(-1)!;
};
