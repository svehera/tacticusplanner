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
    return { data, error: null };
};

export const loginUser = (username: string, password: string) =>
    makeApiCall<ILoginResponse, { username: string; password: string }>('POST', 'LoginUser', {
        username,
        password,
    });
