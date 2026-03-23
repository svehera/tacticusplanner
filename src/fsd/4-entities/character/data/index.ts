import { IRankUpData, UnitDataRaw } from '../model';

import charactersJson from './new-character-data.json';
import charactersRanksJson from './new-rank-up-data.json';

// `mutableCopy(foo) satisfies Foo`; causes more issues than it solves
// @ts-expect-error FIXME: Caused by transition to const JSON imports
export const rankUpData: IRankUpData = charactersRanksJson;
// @ts-expect-error FIXME: Caused by transition to const JSON imports
export const charactersData: UnitDataRaw[] = charactersJson;
