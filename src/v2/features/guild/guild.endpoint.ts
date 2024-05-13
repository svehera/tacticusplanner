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
    return useApi<IGuildRostersResponse, IGuildInfoRequest>('POST', 'GuildRosters', request);
};

export const useValidateGuildMembers = (request: IGuildInfoRequest) => {
    return useApi<IGuildMembersValidationResponse, IGuildInfoRequest>('POST', 'ValidateGuildMembers', request, [
        request.members,
    ]);
};
