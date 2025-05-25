import { ICharacter2 } from '@/fsd/4-entities/character';
import {
    ILegendaryEventStatic,
    ILegendaryEventTrackStatic,
    LegendaryEventEnum,
    LreTrackId,
} from '@/fsd/4-entities/lre';

export type ILreTableRow<T = ICharacter2 | string> = Record<string, T>;

export interface ILegendaryEvent extends ILegendaryEventStatic {
    id: LegendaryEventEnum;
    alpha: ILegendaryEventTrack;
    beta: ILegendaryEventTrack;
    gamma: ILegendaryEventTrack;

    suggestedTeams: ILreTableRow[];
    allowedUnits: Array<ICharacter2>;
    battlesCount: number;
}

export interface ILegendaryEventTrack extends ILegendaryEventTrackStatic {
    eventId: LegendaryEventEnum;
    section: LreTrackId;
    allowedUnits: ICharacter2[];
    unitsRestrictions: Array<ILegendaryEventTrackRequirement>;

    getCharacterPoints(char: ICharacter2): number;

    getCharacterSlots(char: ICharacter2): number;

    getRestrictionPoints(name: string): number;

    suggestTeams(
        settings: IAutoTeamsPreferences | ISelectedTeamsOrdering,
        onlyUnlocked: boolean,
        restrictions: string[]
    ): Record<string, Array<ICharacter2 | undefined>>;

    suggestTeam(
        settings: IAutoTeamsPreferences | ISelectedTeamsOrdering,
        onlyUnlocked: boolean,
        restrictions: string[]
    ): Array<ICharacter2>;
}

export interface ILegendaryEventTrackRequirement {
    id?: string;
    hide?: boolean;
    iconId?: string;
    index?: number;
    name: string;
    points: number;
    units: ICharacter2[];
    selected?: boolean;
}

export interface ILreTeam {
    id: string;
    name: string;
    section: LreTrackId;
    restrictionsIds: string[];
    charactersIds: string[];
    /**
     * Client Side only
     */
    characters?: ICharacter2[];
}

export interface ILegendaryEventSelectedRequirements {
    id: LegendaryEventEnum;
    name: string;
    alpha: SelectedRequirements;
    beta: SelectedRequirements;
    gamma: SelectedRequirements;
}

export type SelectedRequirements = Record<string, boolean>;

export interface IAutoTeamsPreferences {
    preferCampaign: boolean;
    ignoreRarity: boolean;
    ignoreRank: boolean;
    ignoreRecommendedFirst: boolean; // ignore Bias
}

export interface ISelectedTeamsOrdering {
    orderBy: 'name' | 'rank' | 'rarity';
    direction: 'asc' | 'desc';
}
