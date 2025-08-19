import { IErrorResponse, makeApiCall } from '@/fsd/5-shared/api';

import { ILoginResponse, IRegistrationResponse } from './auth.model';

export const registerUser = async (username: string, password: string) => {
    const { data, error } = await makeApiCall<IRegistrationResponse, IErrorResponse>('POST', 'RegisterUser', {
        username,
        password,
    } as any);
    if (error) throw error;
    return { data, error: null };
};

export const loginUser = (username: string, password: string) =>
    makeApiCall<ILoginResponse, IErrorResponse>('POST', 'LoginUser', { username, password } as any);
