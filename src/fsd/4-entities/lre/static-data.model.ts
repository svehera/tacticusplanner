import { allLegendaryEvents } from './data';

export interface IPointsMilestone {
    milestone: number;
    cumulativePoints: number;
    engramPayout: number;
}

export interface IChestMilestone {
    chestLevel: number;
    engramCost: number;
}

export interface ILEProgression {
    unlock: number;
    fourStars: number;
    fiveStars: number;
    blueStar: number;
    // Absent on the oldest events, datamined before Mythic rarity existed.
    mythic?: number;
    twoBlueStars?: number;
}

// TODO: We cannot replace this yet because it is extended by ILegendaryEvent
//      Extending an interface requires a static type, not a derived one.
export interface ILegendaryEventStatic {
    id: number;
    unitSnowprintId: string; // The snowprint ID for the unit.
    name: string;
    wikiLink: string;
    eventStage: number;
    finished: boolean;
    nextEventDate?: string;
    nextEventDateUtc?: string;

    regularMissions: readonly string[];
    premiumMissions: readonly string[];

    alpha: ILegendaryEventTrackStatic;
    beta: ILegendaryEventTrackStatic;
    gamma: ILegendaryEventTrackStatic;

    pointsMilestones: readonly IPointsMilestone[];
    chestsMilestones: readonly IChestMilestone[];

    shardsPerChest: number;
    battlesCount: number;
    constraintsCount: number;
    progression: ILEProgression;
}

// Confirms every entry in allLegendaryEvents structurally satisfies ILegendaryEventStatic.
allLegendaryEvents satisfies readonly ILegendaryEventStatic[];

// TODO: We cannot replace this yet because it is extended by ILegendaryEventTrack
//      Extending an interface requires a static type, not a derived one.
export interface ILegendaryEventTrackStatic {
    name: string;
    killPoints: number;
    battlesPoints: readonly number[];
    enemies: {
        label: string;
    };
}

export type LreTrackId = 'alpha' | 'beta' | 'gamma';
