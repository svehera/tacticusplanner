import { makeApiCall } from '@/fsd/5-shared/api';

import { TacticusGuildRaidResponse, TacticusGuildResponse, TacticusPlayerResponse } from './tacticus-api.models';

export const getTacticusPlayerData = () => makeApiCall<TacticusPlayerResponse>('GET', 'users/playerData');
export const getTacticusGuildData = () => makeApiCall<TacticusGuildResponse>('GET', 'guild');
export const getTacticusGuildRaidData = () => makeApiCall<TacticusGuildRaidResponse>('GET', 'guildRaid');

export interface UpdateTacticusApiKeyOptions {
    shareInGameName?: boolean;
    shareRosterData?: boolean;
    /** Guild-leader opt-in: privately share each guild member's performance data with that member only. */
    shareGuildMemberPerformance?: boolean;
    /** This player's own guild tag (5 alphanumeric chars), used when no guild API key is provided. */
    guildTag?: string;
}

export interface UpdateTacticusApiKeyResponse {
    player: TacticusPlayerResponse;
}

export const updateTacticusApiKey = (
    apiKey: string,
    guildApiKey: string,
    tacticusUserId: string,
    options: UpdateTacticusApiKeyOptions = {}
) => {
    return makeApiCall<UpdateTacticusApiKeyResponse>('PUT', 'users/tacticusApiKey', {
        apiKey,
        guildApiKey,
        tacticusUserId,
        shareInGameNameWithGuild: options.shareInGameName,
        shareRosterDataWithGuild: options.shareRosterData,
        shareGuildMemberPerformance: options.shareGuildMemberPerformance,
        guildTag: options.guildTag,
    });
};
