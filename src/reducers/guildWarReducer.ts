import { IGuildWar, SetStateAction } from '../models/interfaces';
import { defaultData } from '../models/constants';
import { Rarity } from 'src/models/enums';

export type TeamsAction =
    | {
          type: 'UpdateTeam';
          teamId: string;
          lineup: string[];
          rarityCap: Rarity;
      }
    | {
          type: 'UpdateBfLevel';
          battlefieldLevel: number;
      }
    | {
          type: 'UpdateBfSection';
          sectionId: string;
      }
    | SetStateAction<IGuildWar>;

export const guildWarReducer = (state: IGuildWar, action: TeamsAction): IGuildWar => {
    switch (action.type) {
        case 'Set': {
            return action.value ?? defaultData.guildWar;
        }
        case 'UpdateTeam': {
            const { teamId, lineup, rarityCap } = action;
            const existingTeamIndex = state.teams.findIndex(x => x.id === teamId);

            if (existingTeamIndex >= 0) {
                state.teams[existingTeamIndex].lineup = lineup;
                state.teams[existingTeamIndex].rarityCap = rarityCap;
                return {
                    ...state,
                    teams: [...state.teams],
                };
            }

            return state;
        }
        case 'UpdateBfLevel': {
            const { battlefieldLevel } = action;

            return {
                ...state,
                battlefieldLevel,
            };
        }
        case 'UpdateBfSection': {
            const { sectionId } = action;

            return {
                ...state,
                sectionId,
            };
        }
        default: {
            throw new Error();
        }
    }
};
