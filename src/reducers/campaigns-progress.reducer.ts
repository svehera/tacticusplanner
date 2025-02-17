import { ICampaignsProgress, SetStateAction } from '../models/interfaces';
import { defaultData } from '../models/constants';
import { TacticusCampaignProgress } from '@/v2/features/tacticus-integration/tacticus-integration.models';
import { Campaign } from '@/models/enums';

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

const idToCampaign: Record<string, Campaign> = {
    campaign1: Campaign.I,
    campaign2: Campaign.FoC,
    campaign3: Campaign.O,
    campaign4: Campaign.SH,

    mirror1: Campaign.IM,
    mirror2: Campaign.FoCM,
    mirror3: Campaign.OM,
    mirror4: Campaign.SHM,

    elite1: Campaign.IE,
    elite2: Campaign.FoCE,
    elite3: Campaign.OE,
    elite4: Campaign.SHE,

    eliteMirror1: Campaign.IME,
    eliteMirror2: Campaign.FoCME,
    eliteMirror3: Campaign.OME,
    eliteMirror4: Campaign.SHME,
};
