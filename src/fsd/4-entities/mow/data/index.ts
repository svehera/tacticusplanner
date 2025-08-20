import { IMowLevelUpgrade, IMowLevelUpgradesDictionary, IMowsAndUpgradeCosts, IMowStatic, IMowStatic2 } from '../model';

import mowLvlUpCommonJson from './mow-lvl-up-common.json';
import mowUpgradesJson from './mows-upgrades.json';
import mowsJson from './mows.json';
import mows2Json from './newMowData.json';

export const mowsData = mowsJson as IMowStatic[];
export const mows2Data = mows2Json as IMowsAndUpgradeCosts;
export const mowLevelUpCommonData: IMowLevelUpgrade[] = mowLvlUpCommonJson;
export const mowUpgradesData: IMowLevelUpgradesDictionary = mowUpgradesJson;
