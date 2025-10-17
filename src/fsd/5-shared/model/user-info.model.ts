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
}
