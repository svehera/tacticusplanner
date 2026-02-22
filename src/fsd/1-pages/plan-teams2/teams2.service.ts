/* eslint-disable boundaries/element-types */
/* eslint-disable import-x/no-internal-modules */
import { ICharacter2 } from '@/models/interfaces';

import { FactionId, Rank, Rarity, RarityStars } from '@/fsd/5-shared/model';

import { EquipmentService } from '@/fsd/4-entities/equipment';
import { IMow2 } from '@/fsd/4-entities/mow';

import { ISnapshotCharacter, ISnapshotMachineOfWar } from '../input-roster-snapshots/models';

const maxRankForRarity: Record<Rarity, Rank> = {
    [Rarity.Common]: Rank.Iron1,
    [Rarity.Uncommon]: Rank.Bronze1,
    [Rarity.Rare]: Rank.Silver1,
    [Rarity.Epic]: Rank.Gold1,
    [Rarity.Legendary]: Rank.Diamond3,
    [Rarity.Mythic]: Rank.Adamantine3,
};

const maxLevelForRarity: Record<Rarity, number> = {
    [Rarity.Common]: 8,
    [Rarity.Uncommon]: 17,
    [Rarity.Rare]: 26,
    [Rarity.Epic]: 35,
    [Rarity.Legendary]: 50,
    [Rarity.Mythic]: 65,
};

const maxStarsForRarity: Record<Rarity, RarityStars> = {
    [Rarity.Common]: RarityStars.TwoStars,
    [Rarity.Uncommon]: RarityStars.FourStars,
    [Rarity.Rare]: RarityStars.RedOneStar,
    [Rarity.Epic]: RarityStars.RedThreeStars,
    [Rarity.Legendary]: RarityStars.OneBlueStar,
    [Rarity.Mythic]: RarityStars.MythicWings,
};

export class Teams2Service {
    public static passesCharacterFilter(
        c: ICharacter2,
        allowLockedUnits: boolean,
        minRank: Rank,
        maxRank: Rank,
        minRarity: Rarity,
        maxRarity: Rarity,
        factions: FactionId[],
        searchText: string
    ): boolean {
        if (!allowLockedUnits && c.rank === Rank.Locked) {
            return false;
        }
        if (Math.max(c.rank, Rank.Stone1) < minRank || c.rank > maxRank) {
            return false;
        }
        if (c.rarity < minRarity || c.rarity > maxRarity) {
            return false;
        }
        if (factions.length > 0 && !factions.includes(c.faction)) {
            return false;
        }
        if (searchText.trim() !== '') {
            const lowerSearch = searchText.toLowerCase();
            if (
                !c.name.toLowerCase().includes(lowerSearch) &&
                !c.shortName.toLowerCase().includes(lowerSearch) &&
                !(c.snowprintId ?? '').toLowerCase().includes(lowerSearch)
            ) {
                return false;
            }
        }
        return true;
    }

    public static convertCharacter(charData: ICharacter2): ISnapshotCharacter {
        return {
            id: charData.snowprintId!,
            activeAbilityLevel: charData.activeAbilityLevel ?? 0,
            passiveAbilityLevel: charData.passiveAbilityLevel ?? 0,
            rarity: charData.rarity,
            rank: charData.rank,
            xpLevel: charData.level ?? 0,
            stars: charData.stars ?? 0,
            shards: 0,
            mythicShards: 0,
            equip0: EquipmentService.equipmentData.find(equip => equip.id === charData.equipment?.[0]?.id),
            equip1: EquipmentService.equipmentData.find(equip => equip.id === charData.equipment?.[1]?.id),
            equip2: EquipmentService.equipmentData.find(equip => equip.id === charData.equipment?.[2]?.id),
            equip0Level: charData.equipment?.[0]?.level ?? 0,
            equip1Level: charData.equipment?.[1]?.level ?? 0,
            equip2Level: charData.equipment?.[2]?.level ?? 0,
        };
    }

    public static convertMow(mowData: IMow2): ISnapshotMachineOfWar {
        return {
            id: mowData.snowprintId!,
            primaryAbilityLevel: mowData.primaryAbilityLevel ?? 0,
            secondaryAbilityLevel: mowData.secondaryAbilityLevel ?? 0,
            rarity: mowData.rarity,
            stars: mowData.stars ?? 0,
            shards: 0,
            mythicShards: 0,
            locked: false,
        };
    }

    public static passesMowFilter(
        m: IMow2,
        allowLockedUnits: boolean,
        minRarity: Rarity,
        maxRarity: Rarity,
        factions: FactionId[],
        searchText: string
    ): boolean {
        if (!allowLockedUnits && !m.unlocked) {
            return false;
        }
        if (m.rarity < minRarity || m.rarity > maxRarity) {
            return false;
        }
        if (factions.length > 0 && !factions.includes(m.faction)) {
            return false;
        }
        if (searchText.trim() !== '') {
            const lowerSearch = searchText.toLowerCase();
            if (
                !m.name.toLowerCase().includes(lowerSearch) &&
                !m.id.toLowerCase().includes(lowerSearch) &&
                !m.snowprintId!.toLowerCase().includes(lowerSearch)
            ) {
                return false;
            }
        }
        return true;
    }

    public static capCharacterAtRarity(char: ICharacter2, rarityCap: Rarity): ICharacter2 {
        if (char.rarity <= rarityCap) {
            return char;
        }
        return {
            ...char,
            rarity: rarityCap,
            rank: Math.min(maxRankForRarity[rarityCap], char.rank),
            level: Math.min(maxLevelForRarity[rarityCap], char.level ?? 0),
            stars: Math.min(maxStarsForRarity[rarityCap], char.stars ?? 0),
            activeAbilityLevel: Math.min(maxLevelForRarity[rarityCap], char.activeAbilityLevel ?? 0),
            passiveAbilityLevel: Math.min(maxLevelForRarity[rarityCap], char.passiveAbilityLevel ?? 0),
        };
    }

    public static capMowAtRarity(mow: IMow2, rarityCap: Rarity): IMow2 {
        if (mow.rarity <= rarityCap) {
            return mow;
        }
        return {
            ...mow,
            rarity: rarityCap,
            stars: Math.min(maxStarsForRarity[rarityCap], mow.stars ?? 0),
            primaryAbilityLevel: Math.min(maxLevelForRarity[rarityCap], mow.primaryAbilityLevel ?? 0),
            secondaryAbilityLevel: Math.min(maxLevelForRarity[rarityCap], mow.secondaryAbilityLevel ?? 0),
        };
    }
}
