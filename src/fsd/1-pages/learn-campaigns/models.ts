// eslint-disable-next-line import-x/no-internal-modules
import { IRewards } from '@/fsd/4-entities/campaign/model';
import { INpcData, INpcStats } from '@/fsd/4-entities/npc';

// Type definition for the data we extract from the string
export interface ResolvedEnemyData {
    id: string;
    npc: INpcData;
    stats: INpcStats; // The specific stats for this level
}

/** The ID of the upgrade material (or shards) rewarded when completing this battle. */
export function getBattleReward(rewards: IRewards): string {
    // Elite battles give a guaranteed material, so return that.
    for (const reward of rewards.guaranteed) {
        if (reward.id === 'gold') continue;
        return reward.id;
    }
    // Otherwise, return the first potential reward that is not gold.
    for (const reward of rewards.potential) {
        if (reward.id === 'gold') continue;
        return reward.id;
    }
    return '';
}
