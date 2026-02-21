// eslint-disable-next-line import-x/no-internal-modules
import type factions from '@/data/factions.json';

import { Alliance, Rank, Rarity, RarityStars } from '@/fsd/5-shared/model';

import { ICharacter2 } from '@/fsd/4-entities/character';
import { IMow, IMow2, IMowDb } from '@/fsd/4-entities/mow';
import { IUnit } from '@/fsd/4-entities/unit';

type IFactionStatic = (typeof factions)[number];

export interface IRarityCap {
    rarity: Rarity;
    rank: Rank;
    abilitiesLevel: number;
    stars: RarityStars;
}

export type IFaction = IFactionStatic & {
    power: number;
    bsValue: number;
    unlockedCharacters: number;
    units: IUnit[];
};

export interface ICharactersContext {
    showBadges: boolean;
    showAbilitiesLevel: boolean;
    showBsValue: boolean;
    showPower: boolean;
    showCharacterLevel: boolean;
    showCharacterRarity: boolean;
    showEquipment: boolean;
    getOpacity?: (character: IUnit) => number;
}

export type IXpLevel = {
    level: number;
    xpToNextLevel: number;
    totalXp: number;
};

export interface IXpEstimate {
    legendaryBooks: number;
    xpFromPreviousGoalApplied?: boolean;
    gold: number;
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

// Re-export types from FSD entities
export type { ICharacter2, IMow, IMow2, IMowDb, IUnit };
