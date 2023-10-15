import { callApi } from './api.hook';
import { IErrorResponse, ILoginResponse, IRegistrationResponse, IUserDataResponse } from './api-interfaces';
import { IPersonalData2 } from '../models/interfaces';

export const registerUser = (username: string, password: string) =>
    callApi<IRegistrationResponse, IErrorResponse>('POST', 'RegisterUser', { username, password } as any);

export const loginUser = (username: string, password: string) =>
    callApi<ILoginResponse, IErrorResponse>('POST', 'LoginUser', { username, password } as any);

export const getUserDataApi = () => callApi<IUserDataResponse, IErrorResponse>('GET', 'UserData');

export const setUserDataApi = (userData: IPersonalData2) =>
    callApi<IPersonalData2, IErrorResponse>('POST', 'UserData', userData);
