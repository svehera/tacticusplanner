import { IPersonalTeams, SetStateAction } from '../models/interfaces';
import { defaultData } from '../models/constants';
import { IGWTeam } from 'src/v2/features/guild-war/guild-war.models';

export type TeamsAction =
    | {
          type: 'AddOrUpdateGWTeam';
          team: IGWTeam;
      }
    | {
          type: 'UpdateBfLevel';
          battlefieldLevel: number;
      }
    | SetStateAction<IPersonalTeams>;

export const teamsReducer = (state: IPersonalTeams, action: TeamsAction): IPersonalTeams => {
    switch (action.type) {
        case 'Set': {
            return action.value ?? defaultData.teams;
        }
        case 'AddOrUpdateGWTeam': {
            const { team } = action;
            const existingTeamIndex = state.guildWar.teams.findIndex(
                x => x.id === team.id && x.sectionId === team.sectionId
            );

            if (existingTeamIndex >= 0) {
                state.guildWar.teams[existingTeamIndex].lineup = team.lineup;
                return {
                    ...state,
                    guildWar: {
                        ...state.guildWar,
                        teams: [...state.guildWar.teams],
                    },
                };
            }

            return {
                ...state,
                guildWar: {
                    ...state.guildWar,
                    teams: [...state.guildWar.teams, team],
                },
            };
        }
        case 'UpdateBfLevel': {
            const { battlefieldLevel } = action;

            return {
                ...state,
                guildWar: {
                    ...state.guildWar,
                    battlefieldLevel,
                },
            };
        }
        default: {
            throw new Error();
        }
    }
};
