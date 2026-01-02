import { ICharacter2 } from '@/fsd/4-entities/character';
import {
    LegendaryEventEnum,
    IPointsMilestone,
    IChestMilestone,
    ILEProgression,
    LreTrackId,
} from '@/fsd/4-entities/lre';

import { RequirementStatus } from '@/fsd/3-features/lre';

export type ITableRow<T = ICharacter2 | string> = Record<string, T>;

export enum LreSection {
    teams,
    progress,
    tokenomics,
    battles,
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

/**
 * Represents the progress state for a single LRE track, including metadata, requirements, and battle progress.
 *
 * A partial cache of the computed progress for a track. An aggregation of the user's current progress and
 * requirements for the track. As a cache, most, but not all, of these fields can be/are computed from other
 * objects.
 *
 * @property trackId - The unique identifier for the LRE track.
 * @property trackName - The display name of the track.
 * @property totalPoints - The total points accumulated in this track.
 * @property battlesPoints - An array of points earned for each battle in the track.
 * @property requirements - The list of requirements that must be met for this track.
 * @property battles - The progress state for each battle in this track, ordered in reverse (battle 0 is the hardest/final).
 */
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
    completed: boolean; // Legacy - keep for backward compatibility
    blocked: boolean; // Legacy - keep for backward compatibility
    status?: RequirementStatus; // New: RequirementStatus enum value (0-4)
    killScore?: number; // New: For partial kill score tracking
    highScore?: number; // New: For partial high score tracking
}

export interface ILreRequirements {
    id: string;
    iconId: string;
    name: string;
    pointsPerBattle: number;
    totalPoints: number;
    completed: boolean;
}

export enum LeTokenCardRenderMode {
    kStandalone, // The card is rendered standalone, typically to show the next token to be used.
    kInGrid, // The card is rendered in a grid, typically to show multiple tokens.
}
