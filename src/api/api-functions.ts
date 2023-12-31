﻿import { callApi } from './api.hook';
import {
    ICharactersResponse,
    IErrorResponse,
    ILoginResponse,
    IRegistrationResponse,
    IShareTokenResponse,
    IUserDataResponse,
} from './api-interfaces';
import { IPersonalData2 } from '../models/interfaces';

export const registerUser = (username: string, password: string) =>
    callApi<IRegistrationResponse, IErrorResponse>('POST', 'RegisterUser', { username, password } as any);

export const loginUser = (username: string, password: string) =>
    callApi<ILoginResponse, IErrorResponse>('POST', 'LoginUser', { username, password } as any);

export const getSharedCharacters = (username: string, shareToken: string) =>
    callApi<ICharactersResponse, IErrorResponse>('GET', `Characters?username=${username}&shareToken=${shareToken}`);

export const createShareToken = () => callApi<IShareTokenResponse, IErrorResponse>('POST', 'ShareToken');
export const refreshShareToken = () => callApi<IShareTokenResponse, IErrorResponse>('PUT', 'ShareToken');
export const removeShareToken = () => callApi<IShareTokenResponse, IErrorResponse>('DELETE', 'ShareToken');

export const getUserDataApi = () => callApi<IUserDataResponse, IErrorResponse>('GET', 'UserData');

export const setUserDataApi = (userData: IPersonalData2) =>
    callApi<IPersonalData2, IErrorResponse>('POST', 'UserData', userData);
