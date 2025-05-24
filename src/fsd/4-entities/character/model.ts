import {
    Alliance,
    DamageType,
    DynamicProps,
    Equipment,
    Faction,
    Rank,
    Rarity,
    RarityStars,
    RarityString,
    Trait,
    UnitType,
} from '@/fsd/5-shared/model';

import { LegendaryEventEnum } from '@/fsd/4-entities/lre/@x/character';

import { CharacterBias } from './bias.enum';
import { CharacterReleaseRarity } from './character-release-rarity.enum';

export interface IPersonalCharacterData2 {
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
}

export interface IDamageTypes {
    all: DamageType[];
    melee: DamageType;
    range?: DamageType;
    activeAbility?: DamageType;
    passiveAbility?: DamageType;
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
    Name: string;
    Faction: Faction;
    Alliance: Alliance;
    Health: number;
    Damage: number;
    Armour: number;
    'Short Name': string;
    'Full Name': string;
    'Initial rarity': RarityString;
    'Melee Damage': DamageType;
    'Melee Hits': number;
    'Ranged Damage'?: DamageType;
    'Ranged Hits'?: number;
    Distance?: number;
    Movement: number;
    'Trait 1'?: Trait;
    'Trait 2'?: Trait;
    'Trait 3'?: Trait;
    'Trait 4'?: Trait;
    Traits: Trait[];
    'Active Ability'?: DamageType;
    'Passive Ability'?: DamageType;
    Equipment1: Equipment;
    Equipment2: Equipment;
    Equipment3: Equipment;
    Number: number;
    ForcedSummons: boolean;
    RequiredInCampaign: boolean;
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
    ReleaseRarity?: CharacterReleaseRarity;
    releaseDate?: string;
    tacticusId?: string;
    lre?: ILreCharacterStaticData;
}

export interface IUnitData {
    unitType: UnitType.character;
    id: string;
    tacticusId?: string;
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
    equipment1: Equipment;
    equipment2: Equipment;
    equipment3: Equipment;
    meleeHits: number;
    rangeHits?: number;
    rangeDistance?: number;
    movement: number;
    forcedSummons: boolean;
    requiredInCampaign: boolean;
    campaignsRequiredIn?: string[];
    icon: string;
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

export interface IRankUpData2 {
    [rank: string]: string[];
}

export type ICharacter2 = IUnitData & IPersonalCharacterData2 & DynamicProps;

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
    unitName: string;
    rankStart: Rank;
    rankEnd: Rank;
    appliedUpgrades: string[];
    rankPoint5: boolean;
    upgradesRarity: Rarity[];
}
