import { makeApiCall } from 'src/v2/api/makeApiCall';
import { ICreateLearnTeam, IGetTeamsResponse } from 'src/v2/features/learn-teams/learn-teams.models';

export const getTeamsApi = (queryParams: string) => {
    return makeApiCall<IGetTeamsResponse>('get', `teams?${queryParams}`);
};

export const createTeamApi = (team: ICreateLearnTeam) => {
    return makeApiCall<IGetTeamsResponse>('POST', 'teams', team);
};

export const approveTeamApi = (teamId: number) => {
    return makeApiCall('PUT', `teams/${teamId}/approve`);
};

export const rejectTeamApi = (teamId: number, rejectReason: string) => {
    return makeApiCall('PUT', `teams/${teamId}/reject`, { rejectReason });
};

export const giveHonorTeamApi = (teamId: number) => {
    return makeApiCall('POST', `teams/${teamId}/honor`);
};

export const removeHonorTeamApi = (teamId: number) => {
    return makeApiCall('DELETE', `teams/${teamId}/honor`);
};
