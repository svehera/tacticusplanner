import { Rarity } from '@/fsd/5-shared/model';

export enum ArenaLeague {
    kHonorGuard,
    kCaptain,
    kChapterMaster,
}

export interface BlueStarCharacter {
    id: string;
    shardsPerWeek: number;
}

export interface XpIncomeState {
    /** Manual Legendary Books per day */
    manualBooksPerDay: number;

    /** Arena League for weekly legendary book rewards */
    arenaLeague: ArenaLeague;

    /** Flag: Are guild raids looped or cleared manually? */
    loopsRaids: 'yes' | 'no';

    /** Highest raid rarity fully cleared (only if loopsRaids is 'no') */
    clearRarity: Rarity;

    /** Number of additional bosses cleared (only if loopsRaids is 'no') */
    additionalBosses: number;

    /** Number of full loops completed (only if loopsRaids is 'yes') */
    raidLoops: number;

    /** Extra bosses cleared after the final loop (only if loopsRaids is 'yes') */
    extraBossesAfterLoop: number;

    /** Flag: Does the user spend AT to buy books? */
    useAtForBooks: 'yes' | 'no';

    /** Array of Blue Star character IDs selected for AT contribution */
    blueStarCharIds: string[];

    /** Flag: Does the user have MoW at Blue Star for Incursion farming? */
    hasBlueStarMoW: 'yes' | 'no';

    /** Which Legendary Incursion level is being farmed for MoW AT */
    incursionLegendaryLevel: 'L10' | 'L12' | 'M';

    /** Flag: Is the user onslaughting a Blue Star character for AT farming? */
    onslaughtBlueStar: 'yes' | 'no';

    /** Energy spent on Elite nodes per day (0-600, step 10) */
    eliteEnergyPerDay: number;

    /** Energy spent on Non-Elite nodes per day (0-600, step 6) */
    nonEliteEnergyPerDay: number;

    /** Additional books per week from unlisted sources */
    additionalBooksPerWeek: number;
}
