// eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { Difficulty } from 'src/models/enums';
// eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { IGuildMember, IInsightsData, IPersonalCharacterData2 } from 'src/models/interfaces';

import { Rarity } from '@/fsd/5-shared/model';

// eslint-disable-next-line import-x/no-internal-modules, boundaries/element-types -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { IMowDb } from '@/fsd/3-features/characters/characters.models';

export interface IGuildInfoRequest {
    members: IGuildMember[];
}

export interface IGuildInsightsResponse {
    guildUsers: string[];
    userData: Array<IPersonalCharacterData2 & IInsightsData>;
    mows: Array<IMowDb & IInsightsData>;
}

export interface IGuildRostersResponse {
    guildUsers: string[];
    userData: Record<string, IGuildUserData>;
}

export interface IGuildMembersValidationResponse {
    isValid: boolean;
    invalidUsers: Array<{ username: string; reason: string }>;
}

interface IGuildUserData {
    characters: IPersonalCharacterData2[];
    offense: IGuildUserOffense;
}

interface IGuildUserOffense {
    deployedCharacters: string[];
    tokensLeft: number;
}

export interface IGuildWarPlayer {
    username: string;
    unlocked: number;
    slots: Record<Rarity, number>;
    potential: Record<Difficulty, number>;
    enlistedZone: string;
}

export interface IGuildWarOffensePlayer {
    username: string;
    tokensLeft: number;
    charactersLeft: number;
    charactersUnlocked: number;
    rarityPool: Record<Rarity, number>;
}
