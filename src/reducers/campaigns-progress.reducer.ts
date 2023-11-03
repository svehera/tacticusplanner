import { ICampaignsProgress, SetStateAction } from '../models/interfaces';

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
            return action.value;
        }
        case 'Update': {
            return { ...state, [action.campaign]: action.progress };
        }
        default: {
            throw new Error();
        }
    }
};
