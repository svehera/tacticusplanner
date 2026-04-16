export enum Difficulty {
    None,
    Easy,
    Normal,
    Hard,
    VeryHard,
}

export enum DailyRaidsStrategy {
    leastEnergy,
    leastTime,
    allLocations,
    custom,
}

// Re-export from FSD entities
export { PersonalGoalType, CampaignsLocationsUsage } from '@/fsd/4-entities/goal';
