import { IPersonalData, IPersonalData2 } from '../models/interfaces';

export interface ILoginResponse {
    accessToken: string;
}

export interface IRegistrationResponse {
    id: number;
    username: string;
}

export interface IErrorResponse {
    message: string;
}

export interface IUserDataResponse {
    id: number;
    username: string;
    lastModifiedDate: string;
    data: IPersonalData | IPersonalData2 | null;
}
