﻿import { ICharacter2 } from '@/fsd/4-entities/character';
import {
    LegendaryEventEnum,
    IPointsMilestone,
    IChestMilestone,
    ILEProgression,
    LreTrackId,
} from '@/fsd/4-entities/lre';

export type ITableRow<T = ICharacter2 | string> = Record<string, T>;

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

    /** The battles in this track. In reverse order, e.g. battle 0 is the hardest and final battle. */
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

    // The total number of battles in each track. Pre-mythic, this was always
    // 14. Now, it can be 18. So don't want to hardcode it.
    totalBattles?: number;
}
