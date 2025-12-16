// eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { IPersonalCharacterData2 } from 'src/models/interfaces';

// eslint-disable-next-line import-x/no-internal-modules, boundaries/element-types -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
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
