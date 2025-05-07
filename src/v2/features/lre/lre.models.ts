import {
    LegendaryEventEnum,
    IPointsMilestone,
    IChestMilestone,
    ILEProgression,
    LreTrackId,
} from '@/fsd/4-entities/lre';

export enum LreSection {
    teams,
    progress,
    leaderboard,
}

export interface ILreProgressModel {
    eventId: LegendaryEventEnum;
    eventName: string;
    notes: string;
    occurrenceProgress: ILreOccurrenceProgress[];
    tracksProgress: ILreTrackProgress[];
    regularMissions: string[];
    premiumMissions: string[];

    pointsMilestones: IPointsMilestone[];
    chestsMilestones: IChestMilestone[];
    progression: ILEProgression;
    shardsPerChest: number;
}

export interface ILreOccurrenceProgress {
    eventOccurrence: 1 | 2 | 3;
    freeMissionsProgress: number;
    premiumMissionsProgress: number;
    bundlePurchased: boolean;
}

export interface ILreTrackProgress {
    trackId: LreTrackId;
    trackName: string;
    totalPoints: number;
    battlesPoints: number[];
    requirements: ILreRequirements[];
    battles: ILreBattleProgress[];
}

export interface ILreBattleProgress {
    battleIndex: number;
    requirementsProgress: ILreBattleRequirementsProgress[];
    completed: boolean;
    totalPoints: number;
}

export interface ILreBattleRequirementsProgress {
    id: string;
    iconId: string;
    name: string;
    points: number;
    completed: boolean;
    blocked: boolean;
}

export interface ILreRequirements {
    id: string;
    iconId: string;
    name: string;
    pointsPerBattle: number;
    totalPoints: number;
    completed: boolean;
}
