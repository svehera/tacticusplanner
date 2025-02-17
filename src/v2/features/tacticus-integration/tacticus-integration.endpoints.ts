import { makeApiCall } from 'src/v2/api/makeApiCall';
import { TacticusPlayerResponse } from './tacticus-integration.models';

export const getTacticusPlayerData = () => makeApiCall<TacticusPlayerResponse>('GET', 'users/playerData');

export const updateTacticusApiKey = (apiKey: string) =>
    makeApiCall<TacticusPlayerResponse>('PUT', 'users/tacticusApiKey', { apiKey });
