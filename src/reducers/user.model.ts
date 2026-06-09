import { UserRole } from '@/fsd/5-shared/model';

import { IPersonalData, IPersonalData2 } from '../models/interfaces';

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
    /** Backend serializes these two with a `WithGuild` suffix (no [JsonPropertyName]); match it here. */
    shareInGameNameWithGuild?: boolean;
    shareRosterDataWithGuild?: boolean;
    /** Guild-leader opt-in: privately share each guild member's performance data with that member only. */
    shareGuildMemberPerformance?: boolean;
    /** Other guild tags whose leaderboards should be combined with this guild's. Each is 5 alphanumeric chars. */
    combinedGuildTags?: string[] | null;
    /** This player's own guild tag (5 alphanumeric chars), used when no guild API key is provided. */
    guildTag?: string;
    data: IPersonalData | IPersonalData2 | undefined;
}
