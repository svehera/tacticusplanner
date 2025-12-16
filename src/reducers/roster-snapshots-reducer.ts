import { SetStateAction } from '@/models/interfaces';

import { IRosterSnapshotsState } from '@/fsd/1-pages/plan-roster-snapshots/models';

import { defaultData } from '../models/constants';

export type RosterSnapshotsAction =
    | SetStateAction<IRosterSnapshotsState>
    | {
          type: 'SaveRosterSnapshotsState';
          value: IRosterSnapshotsState;
      };

export const rosterSnapshotsActionReducer = (
    state: IRosterSnapshotsState,
    action: RosterSnapshotsAction
): IRosterSnapshotsState => {
    console.log('state before roster-snapshots action:', state);
    console.log('roster-snapshots action:', action);
    switch (action.type) {
        case 'Set': {
            return action.value ?? defaultData.rosterSnapshots;
        }

        case 'SaveRosterSnapshotsState': {
            return {
                ...state,
                ...action.value,
            };
        }

        default: {
            throw new Error('Unknown roster-snapshot action: ' + (action as any).type);
        }
    }
};
