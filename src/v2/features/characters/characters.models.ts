﻿import { DynamicProps, ICharacter2 } from 'src/models/interfaces';
import { CharactersOrderBy } from './enums/characters-order-by';
import { CharactersFilterBy } from './enums/characters-filter-by';
import { Alliance, Faction, Rank, Rarity, RarityStars, RarityString } from 'src/models/enums';
import { UnitType } from 'src/v2/features/characters/units.enums';

export type IUnit = ICharacter2 | IMow;

export interface IFactionStatic {
    alliance: string;
    name: string;
    icon: string;
    color: string;
}

export interface IMowStatic {
    id: string;
    tacticusId: string;
    name: string;
    title: string;
    shortName: string;
    fullName: string;
    releaseDate?: string;
    alliance: Alliance;
    faction: Faction;
    initialRarity: RarityString;
}

export interface IMowDb {
    id: string;
    unlocked: boolean;
    rarity: Rarity;
    stars: RarityStars;
    primaryAbilityLevel: number;
    secondaryAbilityLevel: number;
    shards: number;
}

export interface IMow extends IMowStatic, IMowDb, DynamicProps {
    portraitIcon: string;
    badgeIcon: string;
    unitType: UnitType.mow;
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
    units: IUnit[];
}

export interface IViewControls {
    orderBy: CharactersOrderBy;
    filterBy: CharactersFilterBy;
}

export interface ICharactersContext {
    showBadges: boolean;
    showAbilitiesLevel: boolean;
    showBsValue: boolean;
    showPower: boolean;
    showCharacterLevel: boolean;
    showCharacterRarity: boolean;
    getOpacity?: (character: IUnit) => number;
}

export type IXpLevel = {
    level: number;
    xpToNextLevel: number;
    totalXp: number;
};

export interface IXpEstimate {
    legendaryBooks: number;
    mythicBooks: number;
    legendaryGold: number;
    mythicGold: number;
    currentLevel: number;
    targetLevel: number;
    xpLeft: number;
}

export interface ICharacterAbilityLevelRaw {
    lvl: number;
    gold: number;
    badges: number;
}

export interface ICharacterAbilityLevel {
    lvl: number;
    gold: number;
    badges: number;
    rarity: Rarity;
}

export interface ICharacterAbilitiesMaterialsTotal {
    gold: number;
    alliance: Alliance;
    badges: Record<Rarity, number>;
}
