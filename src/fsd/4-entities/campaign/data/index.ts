import { ICampaignsData, ICampaignConfigs } from '../model';

import campaignConfigsJson from './campaignConfigs.json';
import battleDataJson from './newBattleData.json';

// `mutableCopy(foo) satisfies Foo`; causes more issues than it solves
// @ts-expect-error FIXME: Caused by transition to const JSON imports
export const battleData: ICampaignsData = battleDataJson;
export const campaignConfigs: ICampaignConfigs = campaignConfigsJson;
