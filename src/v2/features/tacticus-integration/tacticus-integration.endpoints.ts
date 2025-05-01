import { makeApiCall } from 'src/v2/api/makeApiCall';

import {
    TacticusGuildRaidResponse,
    TacticusGuildResponse,
    TacticusPlayerResponse,
} from './tacticus-integration.models';

export const getTacticusPlayerData = () => makeApiCall<TacticusPlayerResponse>('GET', 'users/playerData');
export const getTacticusGuildData = () => makeApiCall<TacticusGuildResponse>('GET', 'guild');
export const getTacticusGuildRaidData = () => makeApiCall<TacticusGuildRaidResponse>('GET', 'guildRaid');

export const updateTacticusApiKey = (apiKey: string, guildApiKey: string, tacticusUserId: string) =>
    makeApiCall<TacticusPlayerResponse>('PUT', 'users/tacticusApiKey', { apiKey, guildApiKey, tacticusUserId });
