import {
    Alliance,
    DamageType,
    DynamicProps,
    Faction,
    Rank,
    Rarity,
    RarityStars,
    Trait,
    UnitType,
} from '@/fsd/5-shared/model';

import { LegendaryEventEnum } from '@/fsd/4-entities/lre/@x/character';

import { CharacterBias } from './bias.enum';
import { CharacterReleaseRarity } from './character-release-rarity.enum';

interface IPersonalCharacterData2 {
    name: string;
    rank: Rank;
    rarity: Rarity;
    stars: RarityStars;
    level: number;
    xp: number;
    bias: CharacterBias;
    upgrades: string[];
    activeAbilityLevel: number;
    passiveAbilityLevel: number;
    shards: number;
    mythicShards: number;
}

interface IDamageTypes {
    all: DamageType[];
    melee: DamageType;
    range?: DamageType;
    activeAbility: DamageType[];
    passiveAbility: DamageType[];
}

export interface ILreCharacterStaticData {
    id: LegendaryEventEnum;
    finished: boolean;
    eventStage: number;
    nextEventDate: string;
    nextEventDateUtc?: string;
}

export type ICharLegendaryEvents = Record<LegendaryEventEnum, ICharLegendaryEvent>;

export interface ICharLegendaryEvent {
    alphaPoints: number;
    alphaSlots: number;

    betaPoints: number;
    betaSlots: number;

    gammaPoints: number;
    gammaSlots: number;

    totalPoints: number;
    totalSlots: number;
}

export interface UnitDataRaw {
    id: string;
    Name: string;
    Title: string;
    Faction: string;
    Alliance: string;
    Health: number;
    Damage: number;
    Armour: number;
    'Extra Short Name': string;
    'Short Name': string;
    'Full Name': string;
    'Initial rarity': string;
    'Melee Damage': string;
    'Melee Hits': number;
    'Ranged Damage'?: string;
    'Ranged Hits'?: number;
    Distance?: number;
    Movement: number;
    'Trait 1'?: string;
    'Trait 2'?: string;
    'Trait 3'?: string;
    'Trait 4'?: string;
    Traits: string[];
    'Active Ability'?: string[];
    'Passive Ability'?: string[];
    Equipment1: string;
    Equipment2: string;
    Equipment3: string;
    Number: number;
    ForcedSummons?: boolean;
    RequiredInCampaign?: boolean;
    /**
     * The prefix of each campaign in which this character is required. Some examples:
     * - 'Maladus' would be ['Adeptus Mechanicus']
     * - 'Bellator' would be ['Indomitus', 'Tyranids']
     *
     * By using prefixes, we ensure that the elite, extremis, and challenge campaigns
     * will be included in the list of required campaigns.
     */
    CampaignsRequiredIn?: string[];
    Icon: string;
    RoundIcon: string;
    ReleaseRarity?: number;
    releaseDate?: string;
    lre?: ILreCharacterStaticData;
}

export interface ICharacterData {
    unitType: UnitType.character;
    id: string;
    snowprintId?: string;
    alliance: Alliance;
    faction: Faction;
    name: string;
    fullName: string;
    shortName: string;
    numberAdded: number;
    health: number;
    damage: number;
    armour: number;
    initialRarity: Rarity;
    rarityStars: RarityStars;
    damageTypes: IDamageTypes;
    traits: Trait[];
    equipment1: string;
    equipment2: string;
    equipment3: string;
    meleeHits: number;
    rangeHits?: number;
    rangeDistance?: number;
    movement: number;
    forcedSummons: boolean;
    requiredInCampaign: boolean;
    campaignsRequiredIn?: string[];
    icon: string;
    roundIcon: string;
    legendaryEvents: ICharLegendaryEvents;
    lre?: ILreCharacterStaticData;
    releaseRarity?: CharacterReleaseRarity;
    releaseDate?: string;
}

export interface ICharacterRankRange {
    id: string;
    rankStart: Rank;
    rankEnd: Rank;
    appliedUpgrades: string[];
    rankPoint5: boolean;
}

export interface IRankUpData {
    [character: string]: IRankUpData2 | undefined;
}

interface IRankUpData2 {
    [rank: string]: string[];
}

export type ICharacter2 = ICharacterData & IPersonalCharacterData2 & DynamicProps;

/**
 * Contains the start and end rank of a particular goal, and
 * all of the upgrade material necessary to hit that goal.
 * Upgrade materials may appear multiple times in `upgrades`.
 */
export interface IUnitUpgradeRank {
    rankStart: Rank;
    rankEnd: Rank;
    rankPoint5: boolean;
    upgrades: string[];
}

/**
 * Represents data about a character-associated goal, including the starting
 * and ending rank, the applied upgrades, and the rarity of upgrades to farm
 * first.
 */
export interface IRankLookup {
    unitId: string;
    unitName: string;
    rankStart: Rank;
    rankEnd: Rank;
    appliedUpgrades: string[];
    rankPoint5: boolean;
    upgradesRarity: Rarity[];
}
