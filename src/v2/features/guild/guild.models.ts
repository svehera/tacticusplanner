import { IGuildMember, IInsightsData, IPersonalCharacterData2 } from 'src/models/interfaces';
import { Difficulty, Rarity } from 'src/models/enums';
import { IMowDb } from 'src/v2/features/characters/characters.models';

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

export interface IGuildUserData {
    characters: IPersonalCharacterData2[];
    offense: IGuildUserOffense;
}

export interface IGuildUserOffense {
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
