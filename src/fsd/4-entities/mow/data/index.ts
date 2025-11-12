import { IMowsAndUpgradeCosts, IMowStatic } from '../model';

import mowsJson from './mows.json';
import mows2Json from './newMowData.json';

export const mowsData = mowsJson as IMowStatic[];
export const mows2Data = mows2Json as IMowsAndUpgradeCosts;
