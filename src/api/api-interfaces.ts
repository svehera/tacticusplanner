import { UserRole } from 'src/models/enums';

import { IPersonalCharacter, IPersonalData, IPersonalData2 } from '../models/interfaces';

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
    shareToken?: string;
    role: UserRole;
    pendingTeamsCount: number;
    rejectedTeamsCount: number;
    modifiedDateTicks: string;
    tacticusApiKey: string;
    tacticusUserId: string;
    tacticusGuildApiKey: string;
    data: IPersonalData | IPersonalData2 | null;
}

export interface ICharactersResponse {
    username: string;
    characters: IPersonalCharacter[];
}

export interface IShareTokenResponse {
    username: string;
    shareToken: string;
}

export interface IGetUser {
    username: string;
    createdDate: string;
    shareToken?: string;
    data?: string;
}
