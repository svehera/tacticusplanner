import { ICampaignsProgress, SetStateAction } from '@/models/interfaces';
import { defaultData, idToCampaign } from '@/models/constants';
import { TacticusCampaignProgress } from '@/v2/features/tacticus-integration/tacticus-integration.models';

export type CampaignsProgressAction =
    | {
          type: 'Update';
          campaign: keyof ICampaignsProgress;
          progress: number;
      }
    | {
          type: 'SyncWithTacticus';
          campaigns: TacticusCampaignProgress[];
      }
    | SetStateAction<ICampaignsProgress>;

export const campaignsProgressReducer = (
    state: ICampaignsProgress,
    action: CampaignsProgressAction
): ICampaignsProgress => {
    switch (action.type) {
        case 'Set': {
            return action.value ?? defaultData.campaignsProgress;
        }
        case 'Update': {
            return { ...state, [action.campaign]: action.progress };
        }
        case 'SyncWithTacticus': {
            const result: Partial<ICampaignsProgress> = {};
            for (const campaign of action.campaigns) {
                const campaignKey = idToCampaign[campaign.id];
                if (campaignKey) {
                    result[campaignKey] = campaign.battles.length - 1;
                }
            }
            return { ...state, ...result };
        }
        default: {
            throw new Error();
        }
    }
};
