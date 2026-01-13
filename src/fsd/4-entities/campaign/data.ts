// eslint-disable-next-line import-x/no-internal-modules
import campaignConfigsJson from '@/fsd/5-shared/data/campaignConfigs.json';
// eslint-disable-next-line import-x/no-internal-modules
import battleDataJson from '@/fsd/5-shared/data/newBattleData.json';

import { ICampaignsData, ICampaignConfigs } from './model';

export const battleData: ICampaignsData = battleDataJson;
export const campaignConfigs: ICampaignConfigs = campaignConfigsJson;
