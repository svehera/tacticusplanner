import { IMowsAndUpgradeCosts, IMowStatic } from '../model';

import mowsJson from './mows.json';
import mows2Json from './newMowData.json';

// @ts-expect-error FIXME: Caused by transition to const JSON imports
export const mowsData = mowsJson as IMowStatic[];
// @ts-expect-error FIXME: Caused by transition to const JSON imports
export const mows2Data = mows2Json as IMowsAndUpgradeCosts;
