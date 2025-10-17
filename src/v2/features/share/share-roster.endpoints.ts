import { IErrorResponse, makeApiCall, useApi } from '@/fsd/5-shared/api';

import { ICharactersResponse, IShareTokenResponse } from './share-roster.models';

export const useGetSharedRoster = (username: string, shareToken: string) =>
    useApi<ICharactersResponse>('GET', `Characters?username=${username}&shareToken=${shareToken}`);

export const createShareToken = () => makeApiCall<IShareTokenResponse, IErrorResponse>('POST', 'ShareToken');
export const refreshShareToken = () => makeApiCall<IShareTokenResponse, IErrorResponse>('PUT', 'ShareToken');
export const removeShareToken = () => makeApiCall<IShareTokenResponse, IErrorResponse>('DELETE', 'ShareToken');
