import { IErrorResponse, makeApiCall } from '@/fsd/5-shared/api';

import { IGetUser } from './admin.model';

export const getUsersApi = (username: string) =>
    makeApiCall<IGetUser[], IErrorResponse>('GET', `users?username=${username}`);

export const resetUserPasswordApi = (username: string, password: string) =>
    makeApiCall<void, IErrorResponse>('PUT', `users/${username}/resetPassword`, { username, password } as any);

export const changeUserRoleApi = (username: string, role: number) =>
    makeApiCall<void, IErrorResponse>('PUT', `users/${username}/role`, { role } as any);
