// orb-utils.ts
import { Rarity } from '@/fsd/5-shared/model';

export function filterZeroValues<T extends Record<string, number>>(obj: T) {
    return Object.fromEntries(Object.entries(obj).filter(([, value]) => value > 0)) as Record<string, number>;
}

export const rarityNameMapping: Record<number, string> = {
    [Rarity.Common]: 'Common',
    [Rarity.Uncommon]: 'Uncommon',
    [Rarity.Rare]: 'Rare',
    [Rarity.Epic]: 'Epic',
    [Rarity.Legendary]: 'Legendary',
    [Rarity.Mythic]: 'Mythic',
};
