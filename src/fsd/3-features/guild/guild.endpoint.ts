import { useApi } from '@/fsd/5-shared/api';

import {
    IGuildInfoRequest,
    IGuildInsightsResponse,
    IGuildMembersValidationResponse,
    IGuildRostersResponse,
    // eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
} from '@/fsd/3-features/guild/guild.models';

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
