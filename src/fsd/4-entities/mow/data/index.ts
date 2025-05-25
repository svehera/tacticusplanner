import { IMowLevelUpgrade, IMowLevelUpgradesDictionary, IMowStatic } from '../model';

import mowLvlUpCommonJson from './mow-lvl-up-common.json';
import mowUpgradesJson from './mows-upgrades.json';
import mowsJson from './mows.json';

export const mowsData = mowsJson as IMowStatic[];
export const mowLevelUpCommonData: IMowLevelUpgrade[] = mowLvlUpCommonJson;
export const mowUpgradesData: IMowLevelUpgradesDictionary = mowUpgradesJson;
