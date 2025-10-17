import { UnitType } from '@/fsd/5-shared/model';

import { GameMode } from 'src/v2/features/teams/teams.enums';

import { SlotType, GuidesGroup, GuidesStatus } from './guides.enums';

export interface IGetGuidesQueryParams {
    group?: GuidesGroup;
    primaryModes?: string;
    subModes?: string[];
    unitIds?: string[];
    orderBy?: 'createdAt_asc' | 'createdAt_desc' | 'likes_asc' | 'likes_desc';
    page?: number;
    pageSize?: number;
    guideId?: number;
    createdBy?: string;
}

export interface IGetGuidesResponse {
    teams: IGuide[];
    next: string | null;
    total: number;
}

export interface IGuide {
    teamId: number;
    name: string;
    primaryMode: GameMode;
    createdAt: string;
    guide: string;
    intro: string;
    youtubeLink: string;
    rejectReason: string;
    status: GuidesStatus;
    originalTeamId: number | null;
    likes: number;
    isHonored: boolean;
    createdBy: string;
    moderatedBy: string;
    subModes: string[];
    teamSlots: ITeamSlot[];
    permissions: {
        canHonor: boolean;
        canEdit: boolean;
        canModerate: boolean;
        canDelete: boolean;
    };
}

export interface ICreateGuide {
    primaryMode: GameMode;
    subModes: string[];
    name: string;
    guide: string;
    intro: string;
    youtubeLink?: string;
    teamSlots: ITeamSlot[];
}

export interface ITeamSlot {
    slotNumber: number;
    slotType: SlotType;
    unitType: UnitType;
    unitIds: string[];
}

export interface IGuideFilter {
    createdBy: string | undefined;
    primaryMod: GameMode | undefined;
    subMods: string[] | undefined;
    unitIds: string[] | undefined;
}
