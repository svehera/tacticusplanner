import { defaultData, idToCampaign } from '@/models/constants';
import { ICampaignsProgress, SetStateAction } from '@/models/interfaces';

import { TacticusCampaignProgress } from '@/fsd/5-shared/lib/tacticus-api/tacticus-api.models';

import { mapTacticusCampaignToLocal, mapTacticusCampaignToUpdates } from '@/fsd/4-entities/campaign/campaign-mapper';

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
                // First, try event campaign split (base + challenge)
                const updates = mapTacticusCampaignToUpdates(campaign);
                if (updates && (updates.baseKey || updates.challengeKey)) {
                    if (updates.baseKey !== undefined && updates.baseBattles !== undefined) {
                        result[updates.baseKey] = updates.baseBattles;
                    }
                    if (updates.challengeKey !== undefined && updates.challengeBattles !== undefined) {
                        result[updates.challengeKey] = updates.challengeBattles;
                    }
                    continue;
                }

                // Otherwise, use single-key mapping (event or legacy campaigns)
                const mapped = mapTacticusCampaignToLocal(campaign);
                const fallback = idToCampaign[campaign.id];
                const campaignKey = mapped ?? fallback;
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
