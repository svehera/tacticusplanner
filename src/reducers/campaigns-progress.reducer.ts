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
                const updates = CampaignMapperService.mapTacticusCampaignToCampaignEvent(campaign);
                if (updates && (updates.baseCampaignEventId || updates.challengeCampaignEventId)) {
                    if (updates.baseCampaignEventId !== undefined && updates.baseBattleCount !== undefined) {
                        result[updates.baseCampaignEventId] = updates.baseBattleCount;
                    }
                    if (updates.challengeCampaignEventId !== undefined && updates.challengeBattleCount !== undefined) {
                        result[updates.challengeCampaignEventId] = updates.challengeBattleCount;
                    }
                    continue;
                }

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
