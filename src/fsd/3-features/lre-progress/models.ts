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
    battlesProgress: ILreBattleProgressDto[];
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
