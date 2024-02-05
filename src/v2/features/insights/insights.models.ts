import { IPersonalCharacterData2 } from 'src/models/interfaces';

export interface IInsightsResponse {
    activeLast7Days: number;
    activeLast30Days: number;
    registeredUsers: number;
    averageRosterDataCreationTime: Date;
    userData: IPersonalCharacterData2[];
}
