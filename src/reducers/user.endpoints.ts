import { GenericAbortSignal } from 'axios';

import { IPersonalData2 } from '@/models/interfaces';

import { callApi, IErrorResponse, makeApiCall } from '@/fsd/5-shared/api';

import { IUserDataResponse } from './user.model';

export const getUserDataApi = () => makeApiCall<IUserDataResponse, IErrorResponse>('GET', 'users/me');

export const setUserDataApi = (userData: IPersonalData2, signal?: GenericAbortSignal) =>
    callApi<IPersonalData2, IErrorResponse, IUserDataResponse>(
        'PUT',
        'users/me',
        userData,
        {
            'TP-ModifiedDateTicks': localStorage.getItem('TP-ModifiedDateTicks') ?? '',
        },
        signal
    );
