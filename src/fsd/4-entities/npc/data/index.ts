import { INpcDataRaw } from '../model';

import npcDataJson from './newNpcData.json';

// Cannot be fixed by `mutableCopy(npcDataJson) satisfies INpcDataRaw`; data mismatch?
// @ts-expect-error FIXME: Caused by transition to const JSON imports
export const npcData = npcDataJson satisfies INpcDataRaw;
