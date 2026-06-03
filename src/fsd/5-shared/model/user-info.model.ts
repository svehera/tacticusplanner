import { UserRole } from './user-role.enum';

export interface IUserInfo {
    username: string;
    userId: number;
    role: UserRole;
    pendingTeamsCount: number;
    rejectedTeamsCount: number;
    tacticusApiKey: string;
    tacticusUserId: string;
    tacticusGuildApiKey: string;
    shareInGameName?: boolean;
    shareRosterData?: boolean;
    /** Guild-leader opt-in: privately share each guild member's performance data with that member only. */
    shareGuildMemberPerformance?: boolean;
    /** Other guild tags whose leaderboards should be combined with this guild's. Each is 5 alphanumeric chars. */
    combinedGuildTags?: string[];
    /** This player's own guild tag (5 alphanumeric chars), used when no guild API key is provided. */
    guildTag?: string;
}
