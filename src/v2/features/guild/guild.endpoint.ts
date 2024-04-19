import useApi from 'src/v2/api/useApi.hook';
import {
    IGuildInfoRequest,
    IGuildInsightsResponse,
    IGuildMembersValidationResponse,
    IGuildRostersResponse,
} from 'src/v2/features/guild/guild.models';

export const useGetGuildInsights = (request: IGuildInfoRequest) =>
    useApi<IGuildInsightsResponse, IGuildInfoRequest>('POST', 'GuildInsights', request);

export const useGetGuildRosters = (request: IGuildInfoRequest) => {
    if (!request.members.length) {
        return { loading: false, data: null, error: null };
    }
    return useApi<IGuildRostersResponse, IGuildInfoRequest>('POST', 'GuildRosters', request);
};

export const useValidateGuildMembers = (request: IGuildInfoRequest) => {
    if (!request.members.length) {
        return { loading: false, data: { isValid: true, invalidUsers: [] }, error: null };
    }
    return useApi<IGuildMembersValidationResponse, IGuildInfoRequest>('POST', 'ValidateGuildMembers', request, [
        request.members,
    ]);
};
