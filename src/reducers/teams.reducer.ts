import { IPersonalTeams, SetStateAction } from '../models/interfaces';
import { defaultData } from '../models/constants';
import { IGWTeam } from 'src/v2/features/guild-war/guild-war.models';

export type TeamsAction =
    | {
          type: 'AddOrUpdateGWTeam';
          team: IGWTeam;
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
                x => x.battlefieldLevel === team.battlefieldLevel && x.positionId === x.positionId
            );

            if (existingTeamIndex >= 0) {
                state.guildWar.teams[existingTeamIndex].lineup = team.lineup;
                return {
                    ...state,
                    guildWar: {
                        teams: [...state.guildWar.teams],
                    },
                };
            }

            return {
                ...state,
                guildWar: {
                    teams: [...state.guildWar.teams, team],
                },
            };
        }
        default: {
            throw new Error();
        }
    }
};
