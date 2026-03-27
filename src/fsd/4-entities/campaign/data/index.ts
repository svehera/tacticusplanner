import { ICampaignsData, ICampaignConfigs } from '../model';

import campaignConfigsJson from './campaign-configs.json';
import battleDataJson from './new-battle-data.json';

// `mutableCopy(foo) satisfies Foo`; causes more issues than it solves
// @ts-expect-error FIXME: Caused by transition to const JSON imports
export const battleData: ICampaignsData = battleDataJson;
export const campaignConfigs: ICampaignConfigs = campaignConfigsJson;
