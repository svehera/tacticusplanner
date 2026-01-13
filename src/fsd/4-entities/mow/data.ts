// eslint-disable-next-line import-x/no-internal-modules
import mowsJson from '@/fsd/5-shared/data/mows.json';
// eslint-disable-next-line import-x/no-internal-modules
import mows2Json from '@/fsd/5-shared/data/newMowData.json';

import { IMowsAndUpgradeCosts, IMowStatic } from './model';

export const mowsData = mowsJson as IMowStatic[];
export const mows2Data = mows2Json as IMowsAndUpgradeCosts;
