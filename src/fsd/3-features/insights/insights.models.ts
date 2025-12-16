import { IPersonalCharacterData2 } from 'src/models/interfaces';

import { IMowDb } from '@/fsd/3-features/characters/characters.models';

export interface IInsightsResponse {
    activeLast7Days: number;
    activeLast30Days: number;
    registeredUsers: number;
    tacticusIntegrations: number;
    averageRosterDataCreationTime: Date;
    userData: IPersonalCharacterData2[];
    mows: IMowDb[];
}
