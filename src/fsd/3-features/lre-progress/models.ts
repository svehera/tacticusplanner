import { LegendaryEventEnum, LreTrackId } from '@/fsd/4-entities/lre';

// eslint-disable-next-line import-x/no-internal-modules, boundaries/element-types
import { ILeProgress } from '@/fsd/1-pages/plan-lre/lre.models';

import { LrePointsCategoryId, ProgressState } from './enums';

export interface ILreProgressDto {
    id: LegendaryEventEnum;
    name: string;
    alpha?: ILreTrackProgressLegacyDto;
    beta?: ILreTrackProgressLegacyDto;
    gamma?: ILreTrackProgressLegacyDto;
    /**
     * @deprecated Use compactProgress instead. Kept optional for reading legacy persisted data.
     */
    battlesProgress?: ILreBattleProgressDto[];
    /**
     * Compact storage format. Preferred over battlesProgress for all new writes.
     * Stores per-track, per-requirement state arrays indexed by battleIndex, drastically
     * reducing repetition vs the legacy flat battlesProgress array.
     */
    compactProgress?: ILreCompactProgressDto;
    forceProgress?: ILeProgress;
    overview?: Record<1 | 2 | 3, ILreOverviewDto>;
    notes: string;
}

interface ILreTrackProgressLegacyDto {
    section: LreTrackId;
    battles: Array<boolean[]>;
}

export interface ILreOverviewDto {
    regularMissions: number;
    premiumMissions: number;
    bundle: number;
    ohSoCloseShards?: number;
}

export interface ILreBattleProgressDto {
    trackId: LreTrackId;
    battleIndex: number;
    requirements: ILreRequirementsProgressDto[];
}

export interface ILreRequirementsProgressDto {
    id: LrePointsCategoryId | string;
    state: ProgressState; // Legacy field for backward compatibility
    scoredPoints?: number; // Used for partial kill scores
    highScoredPoints?: number; // Used for partial high scores
    status?: number; // New: RequirementStatus enum value (0-4)
}

/** Top-level compact format: one entry per LRE track. */
export type ILreCompactProgressDto = Partial<Record<LreTrackId, ILreCompactTrackProgressDto>>;

/** Per-track compact progress: keyed by requirement id. */
export type ILreCompactTrackProgressDto = Record<string, ILreCompactRequirementProgressDto>;

export interface ILreCompactRequirementProgressDto {
    /** ProgressState per battle, indexed by battleIndex. Missing = ProgressState.none. */
    states: ProgressState[];
    /** Sparse: battleIndex → scoredPoints. Only stored when non-zero. */
    scoredPoints?: Record<number, number>;
    /** Sparse: battleIndex → highScoredPoints. Only stored when non-zero. */
    highScoredPoints?: Record<number, number>;
    /** Sparse: battleIndex → RequirementStatus value. Only stored when non-default. */
    statuses?: Record<number, number>;
}
