import { Rarity } from '@/fsd/5-shared/model';

export const charsUnlockShards: Record<Rarity, number> = {
    [Rarity.Common]: 40,
    [Rarity.Uncommon]: 80,
    [Rarity.Rare]: 130,
    [Rarity.Epic]: 250,
    [Rarity.Legendary]: 500,
    [Rarity.Mythic]: 1400,
};
