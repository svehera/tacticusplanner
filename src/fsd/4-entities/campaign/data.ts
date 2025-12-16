// eslint-disable-next-line import-x/no-internal-modules
import campaignConfigsJson from '@/data/campaignConfigs.json';
// eslint-disable-next-line import-x/no-internal-modules
import battleDataJson from '@/data/newBattleData.json';

import { ICampaignsData, ICampaignConfigs } from './model';

export const battleData: ICampaignsData = battleDataJson;
export const campaignConfigs: ICampaignConfigs = campaignConfigsJson;
