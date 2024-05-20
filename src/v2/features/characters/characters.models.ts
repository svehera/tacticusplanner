import { ICharacter2 } from 'src/models/interfaces';
import { CharactersOrderBy } from './enums/characters-order-by';
import { CharactersFilterBy } from './enums/characters-filter-by';
import { Alliance, Faction, Rank, Rarity, RarityStars, RarityString } from 'src/models/enums';

export interface IFactionStatic {
    alliance: string;
    name: string;
    icon: string;
    color: string;
}

export interface IMowStatic {
    id: string;
    name: string;
    title: string;
    shortName: string;
    fullName: string;
    alliance: Alliance;
    faction: Faction;
    initialRarity: RarityString;
}

export interface IMowDb {
    id: string;
    unlocked: boolean;
    rarity: Rarity;
    stars: RarityStars;
    activeAbilityLevel: number;
    passiveAbilityLevel: number;
    shards: number;
}

export interface IMow extends IMowStatic, IMowDb {}

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
