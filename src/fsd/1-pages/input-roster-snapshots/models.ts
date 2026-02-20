import { Rank, Rarity, RarityStars } from '@/fsd/5-shared/model';

import { IEquipment } from '@/fsd/4-entities/equipment';

export type RosterSnapshotsImageProp = [HTMLImageElement | undefined, 'loaded' | 'loading' | 'failed'];

// Define the shape of your assets
export interface RosterSnapshotAssets {
    charFrames: RosterSnapshotsImageProp[];
    mowFrames: RosterSnapshotsImageProp[];
    ranks: RosterSnapshotsImageProp[];
    stars: RosterSnapshotsImageProp[];
    shardIcon: RosterSnapshotsImageProp;
    mythicShardIcon: RosterSnapshotsImageProp;
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

export interface ISnapshotUnitDiff {
    id: string;
    rank?: Rank;
    rarity?: Rarity;
    stars?: RarityStars;
    shards?: number;
    mythicShards?: number;
    xpLevel?: number;
    active?: number;
    passive?: number;
    locked?: boolean;
    equip0?: string;
    equip1?: string;
    equip2?: string;
    equip0Level?: number;
    equip1Level?: number;
    equip2Level?: number;
}

export interface IRosterSnapshot {
    // The user provided name of the snapshot.
    name: string;

    // The date the snapshot was created, in milliseconds since epoch (UTC).
    dateMillisUtc: number;

    // The date the snapshot was deleted, in milliseconds since epoch (UTC). Undefined if
    // not deleted.
    deletedDateMillisUtc?: number;

    chars: ISnapshotCharacter[];
    mows: ISnapshotMachineOfWar[];
}

export interface IRosterSnapshotDiff {
    // The user provided name of the snapshot.
    name: string;

    // The date the snapshot was created, in milliseconds since epoch (UTC).
    dateMillisUtc: number;

    // The date the snapshot was deleted, in milliseconds since epoch (UTC). Undefined if
    // not deleted.
    deletedDateMillisUtc?: number;

    charDiffs: ISnapshotUnitDiff[];
    mowDiffs: ISnapshotUnitDiff[];
}

export interface IRosterSnapshotsState {
    // The base snapshot state. If undefined, diffs is ignored.
    base: IRosterSnapshot | undefined;

    // The other snapshot states, diffed to avoid overly large growth. The first one is a diff
    // against base, index 1 is a diff against index 0, index 2 is a diff against index 1, etc.
    diffs: IRosterSnapshotDiff[];
}
