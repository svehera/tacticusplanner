import { INpcData, INpcStats } from '@/fsd/4-entities/npc';

// Type definition for the data we extract from the string
export interface ResolvedEnemyData {
    id: string;
    npc: INpcData;
    stats: INpcStats; // The specific stats for this level
}
