import { Rarity } from '@/fsd/5-shared/model';

export interface IOffenseTeam {
    unitIds: string[];
}

export interface IDefenseTeam {
    // Which rarity caps the user wants to use this team for.
    id: string;
    rarityCaps: Rarity[];
    unitIds: string[];
}

export enum ActionType {
    MAKE_AVAILABLE,
    MAKE_UNAVAILABLE,
}

export interface IUseAction {
    type: ActionType;
    unitId?: string;
    teamId?: string;
}

export interface IWarState {
    usedUnitIds: string[];
    usedTeamIds: string[];
    stateThatCanBeUndone: IUseAction;
    stateThatCanBeRedone: IUseAction;
}
