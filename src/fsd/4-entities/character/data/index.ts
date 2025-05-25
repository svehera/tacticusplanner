import { IRankUpData, UnitDataRaw } from '../model';

import charactersRanksJson from './characters-ranks.data.json';
import charactersJson from './characters.data.json';

export const rankUpData: IRankUpData = charactersRanksJson;
export const charactersData: UnitDataRaw[] = charactersJson;
