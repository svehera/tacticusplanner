import { ICharLegendaryEvent } from '../../models/interfaces';

export enum CharactersSelection {
    All = 'all',
    Unlocked = 'unlocked',
    Selected = 'selected'
}

export interface ITableRow extends ICharLegendaryEvent {
    name: string;
    tooltip: string;
    className: string;
    position: number;
}
