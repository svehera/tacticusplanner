/* eslint-disable boundaries/element-types */

import { Rank, Rarity, RarityStars } from '@/fsd/5-shared/model';

import { IEquipment } from '@/fsd/4-entities/equipment';

type UnitPortraitImageProperty = [HTMLImageElement | undefined, 'loaded' | 'loading' | 'failed'];

export interface UnitPortraitAssets {
    charFrames: UnitPortraitImageProperty[];
    mowFrames: UnitPortraitImageProperty[];
    ranks: UnitPortraitImageProperty[];
    stars: UnitPortraitImageProperty[];
    shardIcon: UnitPortraitImageProperty;
    mythicShardIcon: UnitPortraitImageProperty;
}

export interface ISnapshotCharacter {
    id: string;
    rank: Rank;
    rarity: Rarity;
    stars: RarityStars;
    shards: number;
    mythicShards: number;
    activeAbilityLevel: number;
    passiveAbilityLevel: number;
    equip0?: IEquipment;
    equip1?: IEquipment;
    equip2?: IEquipment;
    equip0Level?: number;
    equip1Level?: number;
    equip2Level?: number;
    xpLevel: number;
}

export interface ISnapshotMachineOfWar {
    id: string;
    rarity: Rarity;
    stars: RarityStars;
    primaryAbilityLevel: number;
    secondaryAbilityLevel: number;
    shards: number;
    mythicShards: number;
    locked: boolean;
}
