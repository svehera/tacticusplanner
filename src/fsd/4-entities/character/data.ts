// eslint-disable-next-line import-x/no-internal-modules
import charactersJson from '@/fsd/5-shared/data/newCharacterData.json';
// eslint-disable-next-line import-x/no-internal-modules
import charactersRanksJson from '@/fsd/5-shared/data/newRankUpData.json';

import { IRankUpData, UnitDataRaw } from './model';

export const rankUpData: IRankUpData = charactersRanksJson;
export const charactersData: UnitDataRaw[] = charactersJson;
