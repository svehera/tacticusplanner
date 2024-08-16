import { IPersonalCharacterData2 } from 'src/models/interfaces';
import { IMowDb } from 'src/v2/features/characters/characters.models';

export interface IInsightsResponse {
    activeLast7Days: number;
    activeLast30Days: number;
    registeredUsers: number;
    averageRosterDataCreationTime: Date;
    userData: IPersonalCharacterData2[];
    mows: IMowDb[];
}
