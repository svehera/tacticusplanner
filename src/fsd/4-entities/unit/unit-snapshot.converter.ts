import { ISnapshotCharacter, ISnapshotMachineOfWar } from '@/fsd/5-shared/ui/unit-portrait';

import { ICharacter2 } from '@/fsd/4-entities/character/@x/unit';
import { EquipmentService } from '@/fsd/4-entities/equipment/@x/unit';
import { IMow2 } from '@/fsd/4-entities/mow/@x/unit';

/** Converts a real roster character into the shape `UnitPortrait`/`RosterSnapshotsUnit` expect. Shards/mythic shards are always zeroed since roster data doesn't track them per-snapshot. */
export function convertCharacterToSnapshot(charData: ICharacter2): ISnapshotCharacter {
    return {
        id: charData.snowprintId,
        activeAbilityLevel: charData.activeAbilityLevel ?? 0,
        passiveAbilityLevel: charData.passiveAbilityLevel ?? 0,
        rarity: charData.rarity,
        rank: charData.rank,
        xpLevel: charData.level ?? 0,
        stars: charData.stars ?? 0,
        shards: charData.shards ?? 0,
        mythicShards: charData.mythicShards ?? 0,
        equip0: EquipmentService.equipmentData.find(equip => equip.id === charData.equipment?.[0]?.id),
        equip1: EquipmentService.equipmentData.find(equip => equip.id === charData.equipment?.[1]?.id),
        equip2: EquipmentService.equipmentData.find(equip => equip.id === charData.equipment?.[2]?.id),
        equip0Level: charData.equipment?.[0]?.level ?? 0,
        equip1Level: charData.equipment?.[1]?.level ?? 0,
        equip2Level: charData.equipment?.[2]?.level ?? 0,
    };
}

/** Converts a real roster MoW into the shape `UnitPortrait`/`RosterSnapshotsUnit` expect. Shards/mythic shards are always zeroed since roster data doesn't track them per-snapshot. */
export function convertMowToSnapshot(mowData: IMow2): ISnapshotMachineOfWar {
    return {
        id: mowData.snowprintId,
        primaryAbilityLevel: mowData.primaryAbilityLevel ?? 0,
        secondaryAbilityLevel: mowData.secondaryAbilityLevel ?? 0,
        rarity: mowData.rarity,
        stars: mowData.stars ?? 0,
        shards: mowData.shards ?? 0,
        mythicShards: mowData.mythicShards ?? 0,
        locked: false,
    };
}
