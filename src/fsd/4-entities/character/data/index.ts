import { IRankUpData, UnitDataRaw } from '../model';

import charactersJson from './newCharacterData.json';
import charactersRanksJson from './newRankUpData.json';

// `mutableCopy(foo) satisfies Foo`; causes more issues than it solves
// @ts-expect-error FIXME: Caused by transition to const JSON imports
export const rankUpData: IRankUpData = charactersRanksJson;

// @ts-expect-error FIXME: Caused by transition to const JSON imports
export const charactersData: UnitDataRaw[] = charactersJson;
