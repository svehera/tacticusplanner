/* eslint-disable boundaries/element-types */
/* eslint-disable import-x/no-internal-modules */
import { ICharacter2 } from '@/models/interfaces';

import { FactionsService } from '@/fsd/5-shared/lib';
import { Faction, Rank, Rarity } from '@/fsd/5-shared/model';

import { IMow2 } from '@/fsd/4-entities/mow';

import { ISnapshotCharacter, ISnapshotMachineOfWar } from '../input-roster-snapshots/models';

export class WarService {
    public static passesCharacterFilter(
        c: ICharacter2,
        minRank: Rank,
        maxRank: Rank,
        minRarity: Rarity,
        maxRarity: Rarity,
        factions: Faction[],
        searchText: string
    ): boolean {
        if (c.rank < minRank || c.rank > maxRank) {
            return false;
        }
        if (c.rarity < minRarity || c.rarity > maxRarity) {
            return false;
        }
        if (
            factions.length > 0 &&
            !factions.includes(FactionsService.snowprintFactionToFaction(c.faction) as Faction)
        ) {
            return false;
        }
        if (searchText.trim() !== '') {
            const lowerSearch = searchText.toLowerCase();
            if (
                !c.name.toLowerCase().includes(lowerSearch) &&
                !c.shortName.toLowerCase().includes(lowerSearch) &&
                !c.snowprintId!.toLowerCase().includes(lowerSearch)
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
        minRarity: Rarity,
        maxRarity: Rarity,
        factions: Faction[],
        searchText: string
    ): boolean {
        if (m.rarity < minRarity || m.rarity > maxRarity) {
            return false;
        }
        if (
            factions.length > 0 &&
            !factions.includes(FactionsService.snowprintFactionToFaction(m.faction) as Faction)
        ) {
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
}
