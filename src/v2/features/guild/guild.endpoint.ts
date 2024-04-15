import useApi from 'src/v2/api/useApi.hook';
import { IGuildInsightsRequest, IGuildInsightsResponse } from 'src/v2/features/guild/guild.models';

export const useGetGuildInsights = (request: IGuildInsightsRequest) =>
    useApi<IGuildInsightsResponse, IGuildInsightsRequest>('POST', 'GuildInsights', request);
