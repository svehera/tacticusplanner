import { Rank, Rarity, RarityStars } from '@/fsd/5-shared/model';

export interface ISnapshotCharacter {
    id: string;
    rank: Rank;
    rarity: Rarity;
    stars: RarityStars;
    active: number;
    passive: number;
}

export interface ISnapshotMachineOfWar {
    id: string;
    rarity: Rarity;
    stars: RarityStars;
    active: number;
    passive: number;
}

export interface ISnapshotUnitDiff {
    id: string;
    rank?: Rank;
    rarity?: Rarity;
    stars?: RarityStars;
    active?: number;
    passive?: number;
}

export interface IRosterSnapshot {
    // The user provided name of the snapshot.
    name: string;

    // The date the snapshot was created, in milliseconds since epoch (UTC).
    dateMillisUtc: number;

    chars: ISnapshotCharacter[];
    mows: ISnapshotMachineOfWar[];
}

export interface IRosterSnapshotDiff {
    // The user provided name of the snapshot.
    name: string;

    // The date the snapshot was created, in milliseconds since epoch (UTC).
    dateMillisUtc: number;

    charDiffs: ISnapshotUnitDiff[];
    mowDiffs: ISnapshotUnitDiff[];
}

export interface IRosterSnapshotsState {
    // The base snapshot state. If undefined, diffs is ignored.
    base: IRosterSnapshot | undefined;
    diffs: IRosterSnapshotDiff[];
}
