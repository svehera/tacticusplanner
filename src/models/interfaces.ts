import {
    Alliance, CharacterBias,
    DamageType,
    Equipment,
    Faction,
    LegendaryEvent,
    LegendaryEvents,
    PersonalGoalType,
    Rank,
    Rarity,
    RarityStars,
    RarityString,
    Trait,
} from './enums';

export type LegendaryEventSection = 'alpha' | 'beta' | 'gamma';

export interface UnitDataRaw {
  Name: string;
  Faction: Faction;
  Alliance: Alliance;
  Health: number;
  Damage: number;
  Armour: number;
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
  Icon: string;
}

export interface IUnitData {
  alliance: Alliance;
  faction: Faction;
  factionColor: string;
  name: string;
  numberAdded: number;
  health: number;
  damage: number;
  armour: number;
  rarity: Rarity;
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
  icon: string;
  legendaryEvents: ICharLegendaryEvents;
}

export interface IDamageTypes {
  all: DamageType[];
  melee: DamageType;
  range?: DamageType;
  activeAbility?: DamageType;
  passiveAbility?: DamageType;
}

export interface IDirtyDozenChar {
  Name: string;
  Rank: number;
  Pvp: number;
  GRTyranid: number;
  GRNecron: number;
  GROrk: number;
  GRMortarion: number;
}

export type ICharacter = IUnitData & IPersonalCharacter;

export type ICharLegendaryEvents = Record<LegendaryEvent, ICharLegendaryEvent>;

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

export interface ILegendaryEvent {
  id: LegendaryEvent;
  name: string;
  alphaTrack: ILegendaryEventTrack;
  betaTrack: ILegendaryEventTrack;
  gammaTrack: ILegendaryEventTrack;

  suggestedTeams: ITableRow[];
  allowedUnits: Array<ICharacter>;
}

export interface ILegendaryEventTrack {
  eventId: LegendaryEvent;
  section: LegendaryEventSection;
  name: string;
  killPoints: number;
  allowedUnits: ICharacter[];
  unitsRestrictions: Array<ILegendaryEventTrackRestriction>;

  getCharacterPoints(char: ICharacter): number;

  getCharacterSlots(char: ICharacter): number;

  getRestrictionPoints(name: string): number;

  suggestTeams(
    settings: IAutoTeamsPreferences,
    restrictions: string[]
  ): Record<string, ICharacter[]>;

  suggestTeam(
    settings: IAutoTeamsPreferences,
    restrictions: string[]
  ): Array<ICharacter>;
}

export interface ILegendaryEventTrackRestriction {
  name: string;
  points: number;
  core?: boolean;
  units: ICharacter[];
}

export type ITableRow<T = ICharacter | string> = Record<string, T>;

export interface IPersonalData {
  autoTeamsPreferences: IAutoTeamsPreferences;
  viewPreferences: Pick<IViewPreferences, 'lightWeight'>;
  selectedTeamOrder: ISelectedTeamsOrdering;
  characters: IPersonalCharacter[];
  charactersPriorityList: string[];
  goals: IPersonalGoal[];
  legendaryEvents: ILegendaryEventsData | undefined;
  legendaryEvents3: ILegendaryEventsData3 | undefined;
  modifiedDate?: Date | string;
}

export interface ILegendaryEventsData {
  jainZar: ILegendaryEventData;
  aunShi: ILegendaryEventData;
  shadowSun: ILegendaryEventData;
}

export type ILegendaryEventsData3 = Record<
  LegendaryEvent,
  ILegendaryEventData3
>;

export type SelectedTeams = Record<string, string[]>;

export interface ILegendaryEventData3 {
  id: LegendaryEvent;
  alpha: SelectedTeams;
  beta: SelectedTeams;
  gamma: SelectedTeams;
}

export interface ILegendaryEventData {
  selectedTeams: ITableRow<string>[];
}

export interface IViewPreferences {
  showAlpha: boolean;
  showBeta: boolean;
  showGamma: boolean;
  lightWeight: boolean;
}

export interface IAutoTeamsPreferences {
  onlyUnlocked: boolean;
  preferCampaign: boolean;
  ignoreRarity: boolean;
  ignoreRank: boolean;
  ignoreRecommendedFirst: boolean;
  ignoreRecommendedLast: boolean;
}

export interface ISelectedTeamsOrdering {
  orderBy: 'name' | 'rank' | 'rarity';
  direction: 'asc' | 'desc';
}

export type IPersonalCharacter = IPersonalCharacterData;

export interface IPersonalCharacterData {
  name: string;
  unlocked: boolean;
  progress: boolean;
  rank: Rank;
  rarity: Rarity;
  rarityStars: RarityStars;
  leSelection: LegendaryEvents;
  alwaysRecommend?: boolean;
  neverRecommend?: boolean;
  bias: CharacterBias;
}

export interface ICharProgression {
  shards: number;
  orbs?: number;
  rarity?: Rarity;
}

export interface IPersonalGoal {
  id: string;
  character: string;
  type: PersonalGoalType;
  priority: number;
  targetRarity?: Rarity;
  targetRank?: Rank;
  notes?: string;
}
