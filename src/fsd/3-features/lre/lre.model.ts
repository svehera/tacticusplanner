import { ICharacter2 } from '@/fsd/4-entities/character';
import {
    ILegendaryEventStatic,
    ILegendaryEventTrackStatic,
    LegendaryEventEnum,
    LreTrackId,
} from '@/fsd/4-entities/lre';

type ILreTableRow<T = ICharacter2 | string> = Record<string, T>;

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
    objectiveType?: string;
    objectiveTarget?: string;
}

export interface ILreTeam {
    id: string;

    name: string;
    /**
     * Which track this team covers, e.g. alpha.
     *
     * TODO: Rename this to trackId.
     */
    section: LreTrackId;

    /**
     * The restrictions the given team meets.
     */
    restrictionsIds: string[];

    /** DO NOT USE. KEPT AROUND FOR USERS THAT HAVEN'T MIGRATED TO MYTHIC YET. */
    charactersIds?: string[];

    charSnowprintIds?: string[];
    /**
     * The number of battles this team is expected to clear against the
     * given restrictions in the specified track.
     */
    expectedBattleClears?: number;
    /**
     * Client Side only
     */
    characters?: ICharacter2[];
    points?: number;
}

export interface ILegendaryEventSelectedRequirements {
    id: LegendaryEventEnum;
    name: string;
    alpha: SelectedRequirements;
    beta: SelectedRequirements;
    gamma: SelectedRequirements;
}

export enum RequirementStatus {
    NotCleared = 0, // Gray - not yet cleared
    Cleared = 1, // Green - cleared (adds points to progress)
    MaybeClear = 2, // Yellow - maybe clear (reminder only)
    StopHere = 3, // Red - stop here, don't attempt (reminder only)
    PartiallyCleared = 4, // Blue - partially cleared with kill score (adds points to progress)
}

export interface IRequirementProgress {
    status: RequirementStatus;
    killScore?: number; // Only applicable for kill score requirements with PartiallyCleared status
}

// Supports both legacy boolean format and new status format
type SelectedRequirements = Record<string, boolean | IRequirementProgress>;

export interface IAutoTeamsPreferences {
    preferCampaign: boolean;
    ignoreRarity: boolean;
    ignoreRank: boolean;
    ignoreRecommendedFirst: boolean; // ignore Bias
}

interface ISelectedTeamsOrdering {
    orderBy: 'name' | 'rank' | 'rarity';
    direction: 'asc' | 'desc';
}
