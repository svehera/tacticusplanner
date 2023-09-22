import { callApi } from './api.hook';
import { IErrorResponse, ILoginResponse, IRegistrationResponse, IUserDataResponse } from './api-interfaces';
import { IPersonalData } from '../models/interfaces';

export const registerUser = (username: string, password: string) =>
    callApi<IRegistrationResponse, IErrorResponse>('POST', `RegisterUser?username=${username}&password=${password}`);

export const loginUser = (username: string, password: string) =>
    callApi<ILoginResponse, IErrorResponse>('POST', `LoginUser?username=${username}&password=${password}`);

export const getUserDataApi = () =>
    callApi<IUserDataResponse, IErrorResponse>('GET', 'UserData');

export const setUserDataApi = (userData: IPersonalData) =>
    callApi<IPersonalData, IErrorResponse>('POST', 'UserData', userData);
