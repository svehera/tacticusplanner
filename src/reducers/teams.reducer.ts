import { IPersonalTeam } from '@/fsd/3-features/teams/teams.models';

import { SetStateAction } from '../models/interfaces';

export type TeamsAction =
    | {
          type: 'Add';
          team: IPersonalTeam;
      }
    | {
          type: 'Update';
          team: IPersonalTeam;
      }
    | {
          type: 'Delete';
          teamId: string;
      }
    | SetStateAction<IPersonalTeam[]>;

export const teamsReducer = (state: IPersonalTeam[], action: TeamsAction) => {
    switch (action.type) {
        case 'Set': {
            return action.value;
        }
        case 'Add': {
            if (state.find(x => x.id === action.team.id)) {
                return state;
            }
            return [...state, action.team];
        }
        case 'Update': {
            const updatedTeam = action.team;
            const updatedTeamIndex = state.findIndex(x => x.id === updatedTeam.id);

            if (updatedTeamIndex < 0) {
                return state;
            }

            state.splice(updatedTeamIndex, 1, updatedTeam);

            return state;
        }
        case 'Delete': {
            return state.filter(x => x.id !== action.teamId);
        }
        default: {
            throw new Error();
        }
    }
};
