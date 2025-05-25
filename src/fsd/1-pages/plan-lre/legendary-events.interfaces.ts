import { ICharacter2, ICharLegendaryEvent } from '@/fsd/4-entities/character';

export enum CharactersSelection {
    All = 'all',
    Unlocked = 'unlocked',
    Selected = 'selected',
}

export enum PointsCalculation {
    unearned = 'unearned',
    all = 'all',
}

export interface ITableRow extends ICharLegendaryEvent {
    character: ICharacter2;
    tooltip: string;
    className: string;
    position: number;
}
