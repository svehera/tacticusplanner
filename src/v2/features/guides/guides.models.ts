import { GameMode } from 'src/v2/features/teams/teams.enums';
import { SlotType, GuidesGroup, GuidesStatus } from './guides.enums';
import { UnitType } from 'src/v2/features/characters/units.enums';

export interface IGetGuidesQueryParams {
    group?: GuidesGroup;
    primaryModes?: string[];
    subModes?: string[];
    unitIds?: string[];
    orderBy?: 'createdAt_asc' | 'createdAt_desc' | 'likes_asc' | 'likes_desc';
    page?: number;
    pageSize?: number;
    guideId?: number;
}

export interface IGetGuidesResponse {
    teams: IGuide[];
    next: string | null;
}

export interface IGuide {
    teamId: number;
    name: string;
    primaryMode: GameMode;
    createdAt: string;
    guide: string;
    intro: string;
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
    teamSlots: ITeamSlot[];
}

export interface ITeamSlot {
    slotNumber: number;
    slotType: SlotType;
    unitType: UnitType;
    unitIds: string[];
}
