import { IRankUpData, UnitDataRaw } from '../model';

import charactersJson from './newCharacterData.json';
import charactersRanksJson from './newRankUpData.json';

export const rankUpData: IRankUpData = charactersRanksJson;
export const charactersData: UnitDataRaw[] = charactersJson;

export { TRAIT_MAP, isValidTraitKey } from './traits';
export type { TraitKey } from './traits';
