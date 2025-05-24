// eslint-disable-next-line import-x/no-internal-modules
import { ITableRow, IAutoTeamsPreferences, ISelectedTeamsOrdering } from '@/models/interfaces';

import { ICharacter2 } from '@/fsd/4-entities/character';
import {
    ILegendaryEventStatic,
    ILegendaryEventTrackStatic,
    LegendaryEventEnum,
    LreTrackId,
} from '@/fsd/4-entities/lre';

export interface ILegendaryEvent extends ILegendaryEventStatic {
    id: LegendaryEventEnum;
    alpha: ILegendaryEventTrack;
    beta: ILegendaryEventTrack;
    gamma: ILegendaryEventTrack;

    suggestedTeams: ITableRow[];
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
