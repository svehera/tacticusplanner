import { defaultData, idToCampaign } from '@/models/constants';
import { ICampaignsProgress, SetStateAction } from '@/models/interfaces';

import { TacticusCampaignProgress } from '@/fsd/5-shared/lib/tacticus-api/tacticus-api.models';

import { CampaignMapperService } from '@/fsd/4-entities/campaign/campaign-mapper-service';

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
                const updates = CampaignMapperService.mapTacticusCampaignToUpdates(campaign);
                if (updates && (updates.baseCampaignEventId || updates.challengeCampaignEventId)) {
                    if (updates.baseCampaignEventId !== undefined && updates.baseBattles !== undefined) {
                        result[updates.baseCampaignEventId] = updates.baseBattles;
                    }
                    if (updates.challengeCampaignEventId !== undefined && updates.challengeBattles !== undefined) {
                        result[updates.challengeCampaignEventId] = updates.challengeBattles;
                    }
                    continue;
                }

                // Otherwise, use single-key mapping (event or legacy campaigns)
                const mapped = CampaignMapperService.mapTacticusCampaignToLocal(campaign);
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
