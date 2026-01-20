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
    settings,
}

export interface ILreProgressModel {
    eventId: LegendaryEventEnum;
    eventName: string;
    notes: string;
    occurrenceProgress: ILreOccurrenceProgress[];
    tracksProgress: ILreTrackProgress[];
    regularMissions: string[];
    premiumMissions: string[];
    // Allow the user to specify their own progress that overrides
    // what the planner has calculated.
    forceProgress?: ILeProgress;

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
    ohSoCloseShards: number;
}

export interface ILeProgress {
    lastUpdateMillisUtc: number;
    hasUsedAdForExtraTokenToday: boolean;
    currentTokens: number;
    maxTokens: number;
    nextChestIndex: number;
    nextTokenMillisUtc?: number;
    regenDelayInSeconds?: number;
    currentPoints: number;
    currentCurrency: number;
    currentShards: number;
    hasPremiumPayout: boolean;
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

/**
 * Represents the progress of a single battle within a LE.
 * @property battleIndex - The zero-based index of the battle within its track.
 * @property requirementsProgress - An array tracking the progress for each requirement of the battle.
 * @property completed - A flag indicating whether the battle has been successfully completed.
 * @property totalPoints - The total points scored in this battle across all successful attempts.
 */
export interface ILreBattleProgress {
    battleIndex: number;
    requirementsProgress: ILreBattleRequirementsProgress[];
    completed: boolean;
    totalPoints: number;
}

/**
 * Represents the progress of a single requirement for a Legendary Release Event (LRE) battle.
 * @property id - The unique identifier for the requirement.
 * @property iconId - The identifier for the icon associated with the requirement.
 * @property name - The display name of the requirement.
 * @property points - The number of points awarded upon completion of the requirement.
 * @property status - The current completion status of the requirement, represented by the `RequirementStatus` enum. This is the preferred property for tracking status.
 * @property killScore - Tracks the partial score for "kill count" type requirements.
 * @property highScore - Tracks the partial score for "high score" type requirements.
 * @property completed - **Legacy Property**. Indicates if the requirement is fully completed. Kept for backward compatibility. Use `status` for new implementations.
 * @property blocked - **Legacy Property**. Indicates if the requirement is blocked. Kept for backward compatibility. Use `status` for new implementations.
 */
export interface ILreBattleRequirementsProgress {
    id: string;
    iconId: string;
    name: string;
    points: number;
    status?: RequirementStatus; // New: RequirementStatus enum value (0-4)
    killScore?: number; // New: For partial kill score tracking
    highScore?: number; // New: For partial high score tracking
    completed: boolean; // Legacy - keep for backward compatibility
    blocked: boolean; // Legacy - keep for backward compatibility
}

/**
 * Represents the requirements for a Legendary Release Event (LRE).
 * @property id - The unique identifier for the requirement.
 * @property iconId - The identifier for the requirement's icon.
 * @property name - The display name of the requirement.
 * @property pointsPerBattle - The number of points awarded per battle for this requirement.
 * @property totalPoints - The total points for this requirement across all battles in the track.
 *                         Usually this is just #battles * points per battle, but some requirements
 *                         can give variable points per battle.
 * @property completed - A flag indicating if the requirement has been fulfilled.
 */
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
