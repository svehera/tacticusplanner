// eslint-disable-next-line import-x/no-internal-modules
import type factions from '@/data/factions.json';

export { Alliance } from './alliance.enum';
export { Rarity, RarityString } from './rarity.enum';
export { RarityStars } from './rarity-stars.enum';
export { Rank, rankToString } from './rank.enum';
export { Trait, getTraitStringFromLabel, getLabelFromTraitString } from './trait.enum';
export { DamageType } from './damage-type.enum';
export { UnitType } from './unit-type.enum';
export { Equipment } from './equipment.enum';

export type FactionId = (typeof factions)[number]['snowprintId'];
export type FactionName = (typeof factions)[number]['name'];
