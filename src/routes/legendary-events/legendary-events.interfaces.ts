import { ICharacter2, ICharLegendaryEvent } from '../../models/interfaces';
import { Rank, Rarity } from '../../models/enums';

export enum CharactersSelection {
    All = 'all',
    Unlocked = 'unlocked',
    Selected = 'selected',
}

export interface ITableRow extends ICharLegendaryEvent {
    character: ICharacter2;
    tooltip: string;
    className: string;
    position: number;
}
