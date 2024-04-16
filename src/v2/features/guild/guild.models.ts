import { IGuildMember, IPersonalCharacterData2 } from 'src/models/interfaces';

export interface IGuildInsightsRequest {
    members: IGuildMember[];
}

export interface IGuildInsightsResponse {
    guildUsers: string[];
    userData: Array<IPersonalCharacterData2 & { numberOfUnlocked: number; ownedBy: string[] }>;
}

export interface IGuildRostersResponse {
    guildUsers: string[];
    userData: Record<string, IPersonalCharacterData2[]>;
}
