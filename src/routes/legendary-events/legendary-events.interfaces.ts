import { ICharLegendaryEvent } from '../../models/interfaces';
import { Rank, Rarity } from '../../models/enums';

export enum CharactersSelection {
    All = 'all',
    Unlocked = 'unlocked',
    Selected = 'selected',
}

export interface ITableRow extends ICharLegendaryEvent {
    name: string;
    rank: Rank;
    rarity: Rarity;
    tooltip: string;
    className: string;
    position: number;
}
