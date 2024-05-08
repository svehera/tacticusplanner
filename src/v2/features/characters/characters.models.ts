import { ICharacter2 } from 'src/models/interfaces';
import { CharactersOrderBy } from './enums/characters-order-by';
import { CharactersFilterBy } from './enums/characters-filter-by';
import { Rank, Rarity, RarityStars } from 'src/models/enums';

export interface IFactionStatic {
    alliance: string;
    name: string;
    icon: string;
    color: string;
}

export interface IRarityCap {
    rarity: Rarity;
    rank: Rank;
    abilitiesLevel: number;
    stars: RarityStars;
}

export interface IFaction extends IFactionStatic {
    power: number;
    bsValue: number;
    unlockedCharacters: number;
    characters: ICharacter2[];
}

export interface IViewControls {
    orderBy: CharactersOrderBy;
    filterBy: CharactersFilterBy;
}

export interface ICharactersContext {
    showBadges: boolean;
    showAbilities: boolean;
    showBsValue: boolean;
    showPower: boolean;
    showCharacterLevel: boolean;
    showCharacterRarity: boolean;
    getOpacity?: (character: ICharacter2) => number;
}

export type IXpLevel = {
    level: number;
    xpToNextLevel: number;
    totalXp: number;
};

export interface IXpEstimate {
    legendaryBooks: number;
    gold: number;
    currentLevel: number;
    targetLevel: number;
    xpLeft: number;
}
