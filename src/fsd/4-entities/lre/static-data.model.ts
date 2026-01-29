import { allLegendaryEvents } from './data';

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

// TODO: Work towards deriving this type from allLegendaryEvents data instead
//      of manually keeping it in sync.
// a.k.a. "Have the data tell us its own type instead of us telling the data what type it is."
allLegendaryEvents satisfies readonly ILegendaryEventStatic[];

export interface ILegendaryEventTrackStatic {
    name: string;
    killPoints: number;
    battlesPoints: readonly number[];
    enemies: {
        label: string;
        link: string;
    };
}

export interface ILEProgression {
    unlock: number;
    fourStars: number;
    fiveStars: number;
    blueStar: number;
    mythic?: number; // Automatic mythic ascension
    twoBlueStars?: number; // Mythic two blue stars
}

export interface IPointsMilestone {
    milestone: number;
    cumulativePoints: number;
    engramPayout: number;
}

export interface IChestMilestone {
    chestLevel: number;
    engramCost: number;
}

export type LreTrackId = 'alpha' | 'beta' | 'gamma';
