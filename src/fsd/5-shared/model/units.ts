import { Rank } from './enums';

export type DynamicProps = {
    numberOfUnlocked?: number;
    ownedBy?: string[];
    potential?: number;
    power?: number;
    teamId?: string; // LRE team id
    statsByOwner?: Array<{
        owner: string;
        rank: Rank;
        activeAbilityLevel: number;
        passiveAbilityLevel: number;
        primaryAbilityLevel: number;
        secondaryAbilityLevel: number;
    }>;
};
