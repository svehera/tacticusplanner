export const MAX_TOKEN = 3;
const TOKEN_REGEN_HOURS = 12;
const SECOND = 1000;
export const MINUTE = 60 * SECOND;
export const HOUR = 60 * MINUTE;
export const millisecondsPerToken = TOKEN_REGEN_HOURS * HOUR;

export interface TokenStatus {
    count: number;
    reloadStart: number;
    exact: boolean;
}

export interface UserSummary {
    userId: string;
    lastBombTime: number;
    tokenStatus: TokenStatus;
    totalDamageDealt: number;
    battleBossCount: number;
    battleSideBossCount: number;
    totalBattleCount: number;
    bombCount: number;
    highestDamage: number;
    bossDamage: number;
    sideBossDamage: number;
    topHeroes: Map<string, number>;
    topMachinesOfWar: Map<string, number>;
    topBosses: Map<string, number>;
    topSideBosses: Map<string, number>;
}

export const updateTokenTo = (tokenState: TokenStatus, time: number): void => {
    const restored = Math.floor((time - tokenState.reloadStart) / millisecondsPerToken);
    tokenState.count += restored;
    if (tokenState.count >= MAX_TOKEN) {
        // Player has capped at this point in time, now we have the exact values
        tokenState.count = MAX_TOKEN;
        // Reload hasn't started before `time`
        tokenState.reloadStart = time;
        tokenState.exact = true;
    } else {
        // reload started when last token was restored
        tokenState.reloadStart += restored * millisecondsPerToken;
    }
};

export const getTimeUntilNextBomb = (userSummary: UserSummary): number => {
    const BOMB_COOLDOWN_HOURS = 18;

    if (!userSummary.lastBombTime) {
        return 0;
    }

    const timeSince = Date.now() - userSummary.lastBombTime;
    const timeUntilNext = BOMB_COOLDOWN_HOURS * HOUR - timeSince;

    return Math.max(timeUntilNext, 0);
};
