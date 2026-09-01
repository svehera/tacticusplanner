import { makeApiCall } from '@/fsd/5-shared/api';

import { ILoginResponse, IRegistrationResponse } from './auth.model';

export const registerUser = async (username: string, password: string) => {
    const { data, error } = await makeApiCall<IRegistrationResponse, { username: string; password: string }>(
        'POST',
        'RegisterUser',
        {
            username,
            password,
        }
    );
    if (error) throw error;
    return { data, error: undefined };
};

export const loginUser = async (username: string, password: string) => {
    const { data, error } = await makeApiCall<ILoginResponse, { username: string; password: string }>(
        'POST',
        'LoginUser',
        {
            username,
            password,
        }
    );
    if (error) throw error;
    return { data, error: undefined };
};

/** Permanently removes the currently authenticated user's account and owned server data. */
export const purgeUserData = () => makeApiCall<void>('DELETE', 'users/me');
