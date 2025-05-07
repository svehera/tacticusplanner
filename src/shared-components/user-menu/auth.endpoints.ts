import { IErrorResponse, makeApiCall } from '@/fsd/5-shared/api';

import { ILoginResponse, IRegistrationResponse } from './auth.model';

export const registerUser = (username: string, password: string) =>
    makeApiCall<IRegistrationResponse, IErrorResponse>('POST', 'RegisterUser', { username, password } as any);

export const loginUser = (username: string, password: string) =>
    makeApiCall<ILoginResponse, IErrorResponse>('POST', 'LoginUser', { username, password } as any);
