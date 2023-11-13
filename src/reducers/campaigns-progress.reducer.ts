import { ICampaignsProgress, SetStateAction } from '../models/interfaces';
import { defaultData } from '../models/constants';

export type CampaignsProgressAction =
    | {
          type: 'Update';
          campaign: keyof ICampaignsProgress;
          progress: number;
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
        default: {
            throw new Error();
        }
    }
};
