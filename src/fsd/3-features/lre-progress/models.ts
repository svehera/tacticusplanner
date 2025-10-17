import { LegendaryEventEnum, LreTrackId } from '@/fsd/4-entities/lre';

import { LrePointsCategoryId, ProgressState } from './enums';

export interface ILreProgressDto {
    id: LegendaryEventEnum;
    name: string;
    alpha?: ILreTrackProgressLegacyDto;
    beta?: ILreTrackProgressLegacyDto;
    gamma?: ILreTrackProgressLegacyDto;
    battlesProgress: ILreBattleProgressDto[];
    overview?: Record<1 | 2 | 3, ILreOverviewDto>;
    notes: string;
}

export interface ILreTrackProgressLegacyDto {
    section: LreTrackId;
    battles: Array<boolean[]>;
}

export interface ILreOverviewDto {
    regularMissions: number;
    premiumMissions: number;
    bundle: number;
}

export interface ILreBattleProgressDto {
    trackId: LreTrackId;
    battleIndex: number;
    requirements: ILreRequirementsProgressDto[];
}

export interface ILreRequirementsProgressDto {
    id: LrePointsCategoryId | string;
    state: ProgressState;
    scoredPoints?: number;
}
