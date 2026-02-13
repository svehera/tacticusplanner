import { cloneDeep } from 'lodash';
import { v4 } from 'uuid';

import { Rank, Rarity, RarityStars, RarityMapper, Alliance } from '@/fsd/5-shared/model';

import { ICampaignsProgress, Campaign } from '@/fsd/4-entities/campaign';
import { CharactersFilterBy, CharactersOrderBy } from '@/fsd/4-entities/character';

import { GuildWarTeamType, IGWLayoutZone } from '@/fsd/3-features/guild-war/guild-war.models';
import { RosterSnapshotDiffStyle, RosterSnapshotShowVariableSettings } from '@/fsd/3-features/view-settings/model';

import { ArenaLeague } from '@/fsd/1-pages/input-xp-income/models';

import { DailyRaidsStrategy, Difficulty, PersonalGoalType } from './enums';
import {
    ICharProgression,
    IDailyRaidsFarmOrder,
    IDailyRaidsHomeScreenEvent,
    IPersonalData2,
    LegendaryEventDefaultPage,
} from './interfaces';

export const rankToLevel: Record<Rank, number> = {
    [Rank.Locked - 1]: 0,
    [Rank.Locked]: 0,
    [Rank.Stone1]: 1,
    [Rank.Stone2]: 3,
    [Rank.Stone3]: 5,
    [Rank.Iron1]: 8,
    [Rank.Iron2]: 11,
    [Rank.Iron3]: 14,
    [Rank.Bronze1]: 17,
    [Rank.Bronze2]: 20,
    [Rank.Bronze3]: 23,
    [Rank.Silver1]: 26,
    [Rank.Silver2]: 29,
    [Rank.Silver3]: 32,
    [Rank.Gold1]: 35,
    [Rank.Gold2]: 38,
    [Rank.Gold3]: 41,
    [Rank.Diamond1]: 44,
    [Rank.Diamond2]: 47,
    [Rank.Diamond3]: 50,
    [Rank.Adamantine1]: 55,
    [Rank.Adamantine2]: 60,
    [Rank.Adamantine3]: 65,
};

export const rankToRarity: Record<Rank, Rarity> = {
    [Rank.Locked]: 0,
    [Rank.Stone1]: Rarity.Common,
    [Rank.Stone2]: Rarity.Common,
    [Rank.Stone3]: Rarity.Common,
    [Rank.Iron1]: Rarity.Common,
    [Rank.Iron2]: Rarity.Uncommon,
    [Rank.Iron3]: Rarity.Uncommon,
    [Rank.Bronze1]: Rarity.Uncommon,
    [Rank.Bronze2]: Rarity.Rare,
    [Rank.Bronze3]: Rarity.Rare,
    [Rank.Silver1]: Rarity.Rare,
    [Rank.Silver2]: Rarity.Epic,
    [Rank.Silver3]: Rarity.Epic,
    [Rank.Gold1]: Rarity.Epic,
    [Rank.Gold2]: Rarity.Legendary,
    [Rank.Gold3]: Rarity.Legendary,
    [Rank.Diamond1]: Rarity.Legendary,
    [Rank.Diamond2]: Rarity.Legendary,
    [Rank.Diamond3]: Rarity.Legendary,
    [Rank.Adamantine1]: Rarity.Mythic,
    [Rank.Adamantine2]: Rarity.Mythic,
    [Rank.Adamantine3]: Rarity.Mythic,
};

export const charsProgression: Record<number, ICharProgression> = {
    //Originally it was this, i changed for coherency but kept the comment for safety (Redwyne)
    //0: { shards: 0 },
    [Rarity.Common + RarityStars.None]: { shards: 0 },
    [Rarity.Common + RarityStars.OneStar]: { shards: 10 },
    [Rarity.Common + RarityStars.TwoStars]: { shards: 15 },
    [Rarity.Uncommon + RarityStars.TwoStars]: { shards: 15, orbs: 10, rarity: Rarity.Uncommon },

    [Rarity.Uncommon + RarityStars.ThreeStars]: { shards: 15 },
    [Rarity.Uncommon + RarityStars.FourStars]: { shards: 15 },
    [Rarity.Rare + RarityStars.FourStars]: { shards: 20, orbs: 10, rarity: Rarity.Rare },

    [Rarity.Rare + RarityStars.FiveStars]: { shards: 30 },
    [Rarity.Rare + RarityStars.RedOneStar]: { shards: 40 },
    [Rarity.Epic + RarityStars.RedOneStar]: { shards: 50, orbs: 10, rarity: Rarity.Epic },

    [Rarity.Epic + RarityStars.RedTwoStars]: { shards: 65 },
    [Rarity.Epic + RarityStars.RedThreeStars]: { shards: 85 },
    [Rarity.Legendary + RarityStars.RedThreeStars]: { shards: 100, orbs: 10, rarity: Rarity.Legendary },

    [Rarity.Legendary + RarityStars.RedFourStars]: { shards: 150, orbs: 10, rarity: Rarity.Legendary },
    [Rarity.Legendary + RarityStars.RedFiveStars]: { shards: 250, orbs: 15, rarity: Rarity.Legendary },
    [Rarity.Legendary + RarityStars.OneBlueStar]: { shards: 500, orbs: 20, rarity: Rarity.Legendary },
    [Rarity.Mythic + RarityStars.OneBlueStar]: { mythicShards: 20, orbs: 10, rarity: Rarity.Mythic },

    [Rarity.Mythic + RarityStars.TwoBlueStars]: { mythicShards: 30, orbs: 10, rarity: Rarity.Mythic },
    [Rarity.Mythic + RarityStars.ThreeBlueStars]: { mythicShards: 50, orbs: 15, rarity: Rarity.Mythic },
    [Rarity.Mythic + RarityStars.MythicWings]: { mythicShards: 100, orbs: 20, rarity: Rarity.Mythic },
};

const defaultCampaignsProgress: ICampaignsProgress = {
    Indomitus: 75,
    'Indomitus Mirror': 75,
    'Indomitus Elite': 0,
    'Indomitus Mirror Elite': 0,

    'Fall of Cadia': 0,
    'Fall of Cadia Mirror': 0,
    'Fall of Cadia Elite': 0,
    'Fall of Cadia Mirror Elite': 0,

    Octarius: 0,
    'Octarius Mirror': 0,
    'Octarius Elite': 0,
    'Octarius Mirror Elite': 0,

    'Saim-Hann': 0,
    'Saim-Hann Mirror': 0,
    'Saim-Hann Elite': 0,
    'Saim-Hann Mirror Elite': 0,

    Onslaught: 0,

    'Adeptus Mechanicus Standard': 0,
    'Adeptus Mechanicus Standard Challenge': 0,
    'Adeptus Mechanicus Extremis': 0,
    'Adeptus Mechanicus Extremis Challenge': 0,

    [Campaign.DGS]: 0,
    [Campaign.DGSC]: 0,
    [Campaign.DGE]: 0,
    [Campaign.DGEC]: 0,

    [Campaign.TS]: 0,
    [Campaign.TSC]: 0,
    [Campaign.TE]: 0,
    [Campaign.TEC]: 0,

    // T'au Empire campaign event
    [Campaign.TAS]: 0,
    [Campaign.TASC]: 0,
    [Campaign.TAE]: 0,
    [Campaign.TAEC]: 0,
};

const defaultGWLayout: IGWLayoutZone[] = [
    { id: 'medicaeStation', players: [] },
    { id: 'headQuarters', players: [] },
    { id: 'voxStation', players: [] },
    { id: 'troopGarrison', players: [] },
    { id: 'armoury', players: [] },
    { id: 'troopGarrison', players: [] },
    { id: 'artilleryPosition', players: [] },
    { id: 'supplyDepot', players: [] },
    { id: 'artilleryPosition', players: [] },
    { id: 'fortifiedPosition', players: [] },
    { id: 'antiAirBattery', players: [] },
    { id: 'fortifiedPosition', players: [] },
    { id: 'frontline', players: [] },
    { id: 'frontline', players: [] },
    { id: 'frontline', players: [] },
];

function createRarityRecord<T>(initialValue: T): Record<Rarity, T> {
    return {
        [Rarity.Common]: cloneDeep(initialValue),
        [Rarity.Uncommon]: cloneDeep(initialValue),
        [Rarity.Rare]: cloneDeep(initialValue),
        [Rarity.Epic]: cloneDeep(initialValue),
        [Rarity.Legendary]: cloneDeep(initialValue),
        [Rarity.Mythic]: cloneDeep(initialValue),
    };
}

function createAllianceRecord<T>(initialValue: T): Record<Alliance, T> {
    return {
        [Alliance.Imperial]: cloneDeep(initialValue),
        [Alliance.Xenos]: cloneDeep(initialValue),
        [Alliance.Chaos]: cloneDeep(initialValue),
    };
}

export const defaultData: IPersonalData2 = {
    schemaVersion: 2,
    modifiedDate: undefined,
    seenAppVersion: undefined,
    dailyRaids: {
        filters: {
            enemiesAlliance: [],
            enemiesFactions: [],
            alliesAlliance: [],
            alliesFactions: [],
            campaignTypes: [],
            upgradesRarity: [],
            slotsCount: [],
            enemiesTypes: [],
        },
        raidedLocations: [],
        lastRefreshDateUTC: new Date().toUTCString(),
    },
    autoTeamsPreferences: {
        preferCampaign: false,
        ignoreRank: false,
        ignoreRarity: false,
        ignoreRecommendedFirst: false,
    },
    viewPreferences: {
        showAlpha: true,
        showBeta: true,
        showGamma: true,
        onlyUnlocked: false,
        hideCompleted: false,
        craftableItemsInInventory: false,
        wyoFilter: CharactersFilterBy.None,
        wyoOrder: CharactersOrderBy.Faction,
        showShardsInRosterSnapshots: RosterSnapshotShowVariableSettings.Always,
        showMythicShardsInRosterSnapshots: RosterSnapshotShowVariableSettings.Always,
        showXpLevelInRosterSnapshots: RosterSnapshotShowVariableSettings.Always,
        showShardsInDiffs: RosterSnapshotShowVariableSettings.Always,
        showMythicShardsInDiffs: RosterSnapshotShowVariableSettings.Always,
        showXpLevelInDiffs: RosterSnapshotShowVariableSettings.Always,
        rosterSnapshotsDiffStyle: RosterSnapshotDiffStyle.Detailed,
        showBadges: true,
        showAbilitiesLevel: true,
        showBsValue: false,
        showPower: true,
        showCharacterLevel: true,
        showCharacterRarity: true,
        inventoryShowAlphabet: true,
        inventoryShowPlusMinus: true,
        goalsTableView: false,
        campaignsTableView: false,
        goalColorMode: 'None',
        raidsTableView: false,
        lreGridView: false,
        lreGoalsPreview: false,
        lreTileShowUnitIcon: true,
        lreTileShowUnitRarity: true,
        lreTileShowUnitRank: true,
        lreTileShowUnitName: true,
        lreTileShowUnitRankBackground: true,
        lreTileShowUnitBias: true,
        lreTileShowUnitActiveAbility: true,
        lreTileShowUnitPassiveAbility: true,
        lreTileShowUnitHealTraits: true,
        lreTileShowUnitRelic: true,
        myProgressShowCoreCharacters: true,
        tokenomicsTableView: true,
        apiIntegrationSyncOptions: ['roster', 'inventory', 'campaignProgress', 'raidedLocations'],
    },
    dailyRaidsPreferences: {
        dailyEnergy: 288,
        shardsEnergy: 0,
        farmPreferences: { order: IDailyRaidsFarmOrder.goalPriority, homeScreenEvent: IDailyRaidsHomeScreenEvent.none },
        farmStrategy: DailyRaidsStrategy.leastEnergy,
        campaignEvent: 'none',
    },
    mows: [],
    teams: [],
    teams2: [],
    warOffense2: { deployedCharacters: [], deployedMows: [] },
    characters: [
        {
            name: 'Varro Tigurius',
            rank: Rank.Stone1,
        },
        {
            name: 'Certus',
            rank: Rank.Stone1,
        },
        {
            name: 'Bellator',
            rank: Rank.Stone1,
        },
        {
            name: 'Incisus',
            rank: Rank.Stone1,
        },
        {
            name: 'Vindicta',
            rank: Rank.Stone1,
        },
    ],
    goals: [
        {
            id: v4(),
            character: 'Bellator',
            type: PersonalGoalType.Ascend,
            targetRarity: Rarity.Legendary,
            priority: 1,
            dailyRaids: true,
        },
        {
            id: v4(),
            character: 'Bellator',
            type: PersonalGoalType.UpgradeRank,
            targetRank: Rank.Diamond1,
            priority: 2,
            dailyRaids: true,
        },
        {
            id: v4(),
            character: 'Aleph-Null',
            type: PersonalGoalType.UpgradeRank,
            targetRank: Rank.Silver1,
            priority: 3,
            dailyRaids: true,
        },
        {
            id: v4(),
            character: 'Eldryon',
            type: PersonalGoalType.Unlock,
            priority: 4,
            dailyRaids: false,
        },
        {
            id: v4(),
            character: 'Eldryon',
            type: PersonalGoalType.CharacterAbilities,
            priority: 5,
            secondAbilityLevel: 50,
            dailyRaids: false,
        },
    ],
    selectedTeamOrder: {
        orderBy: 'name',
        direction: 'asc',
    },
    leTeams: {},
    leProgress: {},
    leSelectedRequirements: {},
    leSettings: {
        defaultPageForActiveEvent: LegendaryEventDefaultPage.TOKENOMICS,
        defaultPageWhenEventNotActive: LegendaryEventDefaultPage.TEAMS,
        showP2POptions: true,
    },
    campaignsProgress: defaultCampaignsProgress,
    inventory: {
        xpBooks: createRarityRecord(0),
        abilityBadges: createAllianceRecord(createRarityRecord(0)),
        components: createAllianceRecord(0),
        forgeBadges: createRarityRecord(0),
        orbs: createAllianceRecord(createRarityRecord(0)),
        upgrades: {},
    },
    guildWar: {
        zoneDifficulty: Difficulty.Easy,
        attackTokens: 10,
        deployedCharacters: [],
        layouts: [
            {
                id: v4(),
                name: 'War zone 1',
                bfLevel: 1,
                zones: defaultGWLayout,
            },
            {
                id: v4(),
                name: 'War zone 2',
                bfLevel: 3,
                zones: defaultGWLayout,
            },
            {
                id: v4(),
                name: 'War zone 3',
                bfLevel: 5,
                zones: defaultGWLayout,
            },
        ],
        teams: [
            ...Array.from({ length: 5 }, (_, i) => ({
                id: v4(),
                name: `Team ${i + 1}`,
                type: GuildWarTeamType.Defense,
                rarityCap: Rarity.Legendary,
                lineup: [],
            })),
            ...Array.from({ length: 10 }, (_, i) => ({
                id: v4(),
                name: `Team ${i + 1}`,
                type: GuildWarTeamType.Offense,
                rarityCap: Rarity.Legendary,
                lineup: [],
            })),
        ],
    },
    guild: {
        members: [],
    },
    xpIncome: {
        // Manual Input
        manualBooksPerDay: 0,

        // Arena
        arenaLeague: ArenaLeague.kHonorGuard,

        // Guild Raid
        loopsRaids: 'no',
        clearRarity: Rarity.Epic,
        additionalBosses: 0,
        raidLoops: 1,
        extraBossesAfterLoop: 0,

        // AT Purchases (Base)
        useAtForBooks: 'no',
        blueStarCharIds: [],

        // AT Farming (Incursion MoW)
        hasBlueStarMoW: 'no',
        incursionLegendaryLevel: 'L12', // Defaults to the highest level

        // AT Farming (Nodes)
        onslaughtBlueStar: 'no',
        eliteEnergyPerDay: 0,
        nonEliteEnergyPerDay: 0,

        // Additional Sources
        additionalBooksPerWeek: 0,
    },
    xpUse: {
        useCommon: true,
        useUncommon: true,
        useRare: true,
        useEpic: true,
        useLegendary: true,
        useMythic: true,
    },
    rosterSnapshots: { base: undefined, diffs: [] },
};

export const goalsLimit = 100;

export const idToCampaign: Record<string, Campaign> = {
    campaign1: Campaign.I,
    campaign2: Campaign.FoC,
    campaign3: Campaign.O,
    campaign4: Campaign.SH,

    mirror1: Campaign.IM,
    mirror2: Campaign.FoCM,
    mirror3: Campaign.OM,
    mirror4: Campaign.SHM,

    elite1: Campaign.IE,
    elite2: Campaign.FoCE,
    elite3: Campaign.OE,
    elite4: Campaign.SHE,

    eliteMirror1: Campaign.IME,
    eliteMirror2: Campaign.FoCME,
    eliteMirror3: Campaign.OME,
    eliteMirror4: Campaign.SHME,

    eventCampaign1: Campaign.AMS,
    eventCampaign2: Campaign.TS,
    eventCampaign3: Campaign.TAS,
};

// Re-export from RarityMapper for backward compatibility
export const rarityToStars = RarityMapper.toStars;
export const rarityToMaxStars = RarityMapper.toMaxStars;
export const rarityToMaxRank = RarityMapper.toMaxRank;

export { charsUnlockShards, charsReleaseShards } from '@/fsd/4-entities/character';
