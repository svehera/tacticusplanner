import { SetStateAction } from '../models/interfaces';

export type SurvivalTeamsAction =
    | {
          type: 'SetTeam';
          eventId: string;
          unitIds: string[];
      }
    | SetStateAction<Record<string, string[]>>;

export const survivalTeamsReducer = (
    state: Record<string, string[]>,
    action: SurvivalTeamsAction
): Record<string, string[]> => {
    switch (action.type) {
        case 'Set': {
            return action.value;
        }
        case 'SetTeam': {
            return { ...state, [action.eventId]: action.unitIds };
        }
        default: {
            // @ts-expect-error TS says this should never be reached but we want the error if it does
            throw new Error(`Unexpected action.type received in reducer: ${action.type}`);
        }
    }
};
