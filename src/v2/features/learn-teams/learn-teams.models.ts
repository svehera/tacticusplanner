import { GameMode } from 'src/v2/features/teams/teams.enums';
import { SlotType, TeamsGroup, TeamStatus } from 'src/v2/features/learn-teams/learn-teams.enums';
import { UnitType } from 'src/v2/features/characters/units.enums';

export interface IGetTeamsQueryParams {
    group?: TeamsGroup;
    primaryModes?: string[];
    subModes?: string[];
    unitIds?: string[];
    orderBy?: 'createdAt_asc' | 'createdAt_desc' | 'likes_asc' | 'likes_desc';
    page?: number;
    pageSize?: number;
}

export interface IGetTeamsResponse {
    teams: ILearnTeam[];
    next: string | null;
}

export interface ILearnTeam {
    teamId: number;
    name: string;
    primaryMode: GameMode;
    createdAt: string;
    guide: string;
    intro: string;
    status: TeamStatus;
    originalTeamId: number | null;
    likes: number;
    isHonored: boolean;
    createdBy: string;
    subModes: string[];
    teamSlots: ITeamSlot[];
}

export interface ICreateLearnTeam {
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
