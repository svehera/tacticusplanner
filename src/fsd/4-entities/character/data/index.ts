import { ICharacterCombatProfile, IRankUpData, UnitDataRaw } from '../model';

import charactersJson from './new-character-data.json';
import characterData2Json from './new-character-data2.json';
import charactersRanksJson from './new-rank-up-data.json';

// `mutableCopy(foo) satisfies Foo`; causes more issues than it solves
// @ts-expect-error FIXME: Caused by transition to const JSON imports
export const rankUpData: IRankUpData = charactersRanksJson;
// @ts-expect-error FIXME: Caused by transition to const JSON imports
export const charactersData: UnitDataRaw[] = charactersJson;
// @ts-expect-error FIXME: Caused by transition to const JSON imports
export const charactersData2: ICharacterCombatProfile[] = characterData2Json;
