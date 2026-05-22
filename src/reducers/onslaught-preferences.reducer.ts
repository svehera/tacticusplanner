import { SetStateAction } from '@/models/interfaces';

import { Alliance } from '@/fsd/5-shared/model';

import {
    IAllianceOnslaughtPrefs,
    IOnslaughtPreferences,
    OnslaughtSector,
    OnslaughtTier,
    defaultOnslaughtPreferences,
} from '@/fsd/1-pages/input-onslaught/onslaught-rewards';

export type OnslaughtPreferencesAction =
    | SetStateAction<IOnslaughtPreferences>
    | {
          type: 'UpdateAlliance';
          alliance: Alliance;
          sector: OnslaughtSector;
          tier: OnslaughtTier;
      };

export const onslaughtPreferencesReducer = (
    state: IOnslaughtPreferences,
    action: OnslaughtPreferencesAction
): IOnslaughtPreferences => {
    switch (action.type) {
        case 'Set': {
            return action.value ?? defaultOnslaughtPreferences;
        }
        case 'UpdateAlliance': {
            const updated: IAllianceOnslaughtPrefs = { sector: action.sector, tier: action.tier };
            return { ...state, [action.alliance]: updated };
        }
        default: {
            // @ts-expect-error TS says this should never be reached but we want the error if it does
            throw new Error(`Unexpected action.type received in reducer: ${action.type}`);
        }
    }
};
