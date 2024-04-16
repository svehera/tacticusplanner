import useApi from 'src/v2/api/useApi.hook';
import {
    IGuildInsightsRequest,
    IGuildInsightsResponse,
    IGuildRostersResponse,
} from 'src/v2/features/guild/guild.models';

export const useGetGuildInsights = (request: IGuildInsightsRequest) =>
    useApi<IGuildInsightsResponse, IGuildInsightsRequest>('POST', 'GuildInsights', request);

export const useGetGuildRosters = (request: IGuildInsightsRequest) =>
    useApi<IGuildRostersResponse, IGuildInsightsRequest>('POST', 'GuildRosters', request);
