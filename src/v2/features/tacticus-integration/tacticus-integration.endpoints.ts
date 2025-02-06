import { makeApiCall } from 'src/v2/api/makeApiCall';
import { TacticusPlayerResponse } from './tacticus-integration.models';

export const getTacticusPlayerData = () => makeApiCall<TacticusPlayerResponse>('GET', 'users/playerData');
