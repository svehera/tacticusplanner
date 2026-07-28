import { IMowsAndUpgradeCosts, IMowStatic, IMowStatic3 } from '../model';

import mowsJson from './mows.json';
import mows2Json from './new-mow-data.json';
import mowsData2Json from './new-mows-data2.json';

// @ts-expect-error FIXME: Caused by transition to const JSON imports
export const mowsData = mowsJson as IMowStatic[];
// @ts-expect-error FIXME: Caused by transition to const JSON imports
export const mows2Data = mows2Json as IMowsAndUpgradeCosts;
// @ts-expect-error FIXME: Caused by transition to const JSON imports
export const mowsData2 = mowsData2Json as IMowStatic3[];
