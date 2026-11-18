import { Rarity, XP_BOOK_VALUE } from '@/fsd/5-shared/model';

export interface XpUseState {
    useCommon: boolean;
    useUncommon: boolean;
    useRare: boolean;
    useEpic: boolean;
    useLegendary: boolean;
    useMythic: boolean;
}

export interface XpBooksTotals {
    /** Total XP across the enabled book rarities. */
    xp: number;
    /** The same XP expressed as a (possibly fractional) count of Mythic books. */
    mythicBooks: number;
}

/** Sums XP over the rarities the user hasn't deselected, and converts it to Mythic-book equivalents. */
export const computeXpBooksTotals = (
    xpBooks: Record<Rarity, number>,
    enabled: readonly boolean[] // indexed by Rarity
): XpBooksTotals => {
    let xp = 0;
    for (const [rarityKey, value] of Object.entries(XP_BOOK_VALUE) as [string, number][]) {
        const rarity = Number(rarityKey) as Rarity;
        if (enabled[rarity]) xp += (xpBooks[rarity] ?? 0) * value;
    }
    return { xp, mythicBooks: xp / XP_BOOK_VALUE[Rarity.Mythic] };
};
