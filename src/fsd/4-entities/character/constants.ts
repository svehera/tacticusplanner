import { Rarity } from '@/fsd/5-shared/model';

import { CharacterReleaseRarity } from './character-release-rarity.enum';

export const charsUnlockShards: Record<Rarity, number> = {
    [Rarity.Common]: 40,
    [Rarity.Uncommon]: 80,
    [Rarity.Rare]: 130,
    [Rarity.Epic]: 250,
    [Rarity.Legendary]: 500,
    // Mythic characters must be ascended from Legendary, there are no unlockables
    [Rarity.Mythic]: 0,
};

export const charsReleaseShards: Record<CharacterReleaseRarity, number> = {
    [CharacterReleaseRarity.Common]: 40,
    [CharacterReleaseRarity.Uncommon]: 100,
    [CharacterReleaseRarity.Rare]: 280,
    [CharacterReleaseRarity.Epic]: 400,
    [CharacterReleaseRarity.LegendaryOld]: 150,
    [CharacterReleaseRarity.Legendary]: 400,
};
