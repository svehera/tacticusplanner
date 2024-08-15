import { makeApiCall } from 'src/v2/api/makeApiCall';
import { ICreateLearnTeam, IGetTeamsResponse } from 'src/v2/features/learn-teams/learn-teams.models';

export const getTeamsApi = (queryParams: string) => {
    return makeApiCall<IGetTeamsResponse>('get', `teams?${queryParams}`);
};

export const createTeamApi = (team: ICreateLearnTeam) => {
    return makeApiCall<IGetTeamsResponse>('POST', 'teams', team);
};
