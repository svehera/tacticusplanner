import { makeApiCall } from '@/fsd/5-shared/api';

import { ICreateGuide, IGetGuidesResponse } from './guides.models';

export const getTeamsApi = (queryParams: string) => {
    return makeApiCall<IGetGuidesResponse>('get', `guides?${queryParams}`);
};

export const createTeamApi = (team: ICreateGuide) => {
    return makeApiCall<IGetGuidesResponse>('POST', 'guides', team);
};

export const updateTeamApi = (guideId: number, guide: ICreateGuide) => {
    return makeApiCall<IGetGuidesResponse>('PUT', `guides/${guideId}`, guide);
};

export const approveTeamApi = (teamId: number) => {
    return makeApiCall('PUT', `guides/${teamId}/approve`);
};

export const rejectTeamApi = (teamId: number, rejectReason: string) => {
    return makeApiCall('PUT', `guides/${teamId}/reject`, { rejectReason });
};

export const giveHonorTeamApi = (teamId: number) => {
    return makeApiCall('POST', `guides/${teamId}/honor`);
};

export const removeHonorTeamApi = (teamId: number) => {
    return makeApiCall('DELETE', `guides/${teamId}/honor`);
};
