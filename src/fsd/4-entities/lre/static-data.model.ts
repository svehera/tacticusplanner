import { allLegendaryEvents } from './data';

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

// TODO: Work towards deriving this type from allLegendaryEvents data instead
//      of manually keeping it in sync.
// a.k.a. "Have the data tell us its own type instead of us telling the data what type it is."
allLegendaryEvents satisfies readonly ILegendaryEventStatic[];

// TODO: We cannot replace this yet because it is extended by ILegendaryEventTrack
//      Extending an interface requires a static type, not a derived one.
export interface ILegendaryEventTrackStatic {
    name: string;
    killPoints: number;
    battlesPoints: readonly number[];
    enemies: {
        label: string;
        link: string;
    };
}

type ActualLegendaryEvents = (typeof allLegendaryEvents)[number];
export type ILEProgression = ActualLegendaryEvents['progression'];
export type IPointsMilestone = ActualLegendaryEvents['pointsMilestones'][number];
export type IChestMilestone = ActualLegendaryEvents['chestsMilestones'][number];

export type LreTrackId = 'alpha' | 'beta' | 'gamma';
