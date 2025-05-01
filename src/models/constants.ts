import { v4 } from 'uuid';

import { DanteLegendaryEvent } from 'src/models/legendary-events/dante.le';
import { KharnLegendaryEvent } from 'src/models/legendary-events/kharn.le';
import { MephistonLegendaryEvent } from 'src/models/legendary-events/mephiston.le';
import { PatermineLegendaryEvent } from 'src/models/legendary-events/patermine.le';
import { UnknownLegendaryEvent } from 'src/models/legendary-events/unknown';

import { CharactersFilterBy } from 'src/v2/features/characters/enums/characters-filter-by';
import { CharactersOrderBy } from 'src/v2/features/characters/enums/characters-order-by';
import { GuildWarTeamType, IGWLayoutZone } from 'src/v2/features/guild-war/guild-war.models';

import {
    Campaign,
    CharacterReleaseRarity,
    DailyRaidsStrategy,
    Difficulty,
    LegendaryEventEnum,
    PersonalGoalType,
    Rank,
    Rarity,
    RarityStars,
    RarityString,
} from './enums';
import { ICampaignsProgress, ICharacter2, ICharProgression, IPersonalData2 } from './interfaces';
import { AunShiLegendaryEvent, ShadowSunLegendaryEvent } from './legendary-events';
import { RagnarLegendaryEvent } from './legendary-events/ragnar.le';
import { VitruviusLegendaryEvent } from './legendary-events/vitruvius.le';

export const rarityStringToNumber: Record<RarityString, Rarity> = {
    [RarityString.Common]: Rarity.Common,
    [RarityString.Uncommon]: Rarity.Uncommon,
    [RarityString.Rare]: Rarity.Rare,
    [RarityString.Epic]: Rarity.Epic,
    [RarityString.Legendary]: Rarity.Legendary,
};

export const rarityToStars: Record<Rarity, RarityStars> = {
    [Rarity.Common]: RarityStars.None,
    [Rarity.Uncommon]: RarityStars.TwoStars,
    [Rarity.Rare]: RarityStars.FourStars,
    [Rarity.Epic]: RarityStars.RedOneStar,
    [Rarity.Legendary]: RarityStars.RedThreeStars,
};

export const rarityToMaxStars: Record<Rarity, RarityStars> = {
    [Rarity.Common]: RarityStars.TwoStars,
    [Rarity.Uncommon]: RarityStars.FourStars,
    [Rarity.Rare]: RarityStars.RedOneStar,
    [Rarity.Epic]: RarityStars.RedThreeStars,
    [Rarity.Legendary]: RarityStars.BlueStar,
};

export const rarityToMaxRank: Record<Rarity, Rank> = {
    [Rarity.Common]: Rank.Iron1,
    [Rarity.Uncommon]: Rank.Bronze1,
    [Rarity.Rare]: Rank.Silver1,
    [Rarity.Epic]: Rank.Gold1,
    [Rarity.Legendary]: Rank.Diamond3,
};

export const rankToLevel: Record<Rank, number> = {
    [Rank.Locked - 1]: 0,
    [Rank.Locked]: 0,
    [Rank.Stone1]: 3,
    [Rank.Stone2]: 5,
    [Rank.Stone3]: 8,
    [Rank.Iron1]: 11,
    [Rank.Iron2]: 14,
    [Rank.Iron3]: 17,
    [Rank.Bronze1]: 20,
    [Rank.Bronze2]: 23,
    [Rank.Bronze3]: 26,
    [Rank.Silver1]: 29,
    [Rank.Silver2]: 32,
    [Rank.Silver3]: 35,
    [Rank.Gold1]: 38,
    [Rank.Gold2]: 41,
    [Rank.Gold3]: 44,
    [Rank.Diamond1]: 47,
    [Rank.Diamond2]: 50,
    [Rank.Diamond3]: 50,
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
};

export const charsProgression: Record<number, ICharProgression> = {
    0: { shards: 0 },
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
    [Rarity.Legendary + RarityStars.BlueStar]: { shards: 500, orbs: 20, rarity: Rarity.Legendary },
};

export const charsUnlockShards: Record<Rarity, number> = {
    [Rarity.Common]: 40,
    [Rarity.Uncommon]: 80,
    [Rarity.Rare]: 130,
    [Rarity.Epic]: 250,
    [Rarity.Legendary]: 500,
};

export const charsReleaseShards: Record<CharacterReleaseRarity, number> = {
    [CharacterReleaseRarity.Common]: 40,
    [CharacterReleaseRarity.Uncommon]: 100,
    [CharacterReleaseRarity.Rare]: 280,
    [CharacterReleaseRarity.Epic]: 400,
    [CharacterReleaseRarity.LegendaryOld]: 150,
    [CharacterReleaseRarity.Legendary]: 400,
};

export const getLegendaryEvent = (id: LegendaryEventEnum, characters: ICharacter2[]) => {
    switch (id) {
        case LegendaryEventEnum.AunShi:
            return new AunShiLegendaryEvent(characters);
        case LegendaryEventEnum.Unknown:
            return new UnknownLegendaryEvent(characters);
        case LegendaryEventEnum.Dante:
            return new DanteLegendaryEvent(characters);
        case LegendaryEventEnum.Kharn:
            return new KharnLegendaryEvent(characters);
        case LegendaryEventEnum.Mephiston:
            return new MephistonLegendaryEvent(characters);
        case LegendaryEventEnum.Patermine:
            return new PatermineLegendaryEvent(characters);
        case LegendaryEventEnum.Ragnar:
            return new RagnarLegendaryEvent(characters);
        case LegendaryEventEnum.Shadowsun:
            return new ShadowSunLegendaryEvent(characters);
        case LegendaryEventEnum.Vitruvius:
            return new VitruviusLegendaryEvent(characters);
        default:
            return new ShadowSunLegendaryEvent(characters);
    }
};
export const isTabletOrMobileMediaQuery = '(max-width: 1000px)';

export const pooEmoji = String.fromCodePoint(parseInt('1F4A9', 16));
export const starEmoji = String.fromCodePoint(parseInt('1F31F', 16));

export const discordInvitationLink = 'https://discord.gg/8mcWKVAYZf';
export const bmcLink = 'https://www.buymeacoffee.com/tacticusplanner';

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

    'Adeptus Mechanicus Standard': 0,
    'Adeptus Mechanicus Standard Challenge': 0,
    'Adeptus Mechanicus Extremis': 0,
    'Adeptus Mechanicus Extremis Challenge': 0,

    Onslaught: 0,

    [Campaign.TS]: 0,
    [Campaign.TSC]: 0,
    [Campaign.TE]: 0,
    [Campaign.TEC]: 0,
};

export const defaultGWLayout: IGWLayoutZone[] = [
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
            enemiesCount: [],
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
        theme: 'light',
        showAlpha: true,
        showBeta: true,
        showGamma: true,
        onlyUnlocked: false,
        hideCompleted: false,
        craftableItemsInInventory: false,
        wyoFilter: CharactersFilterBy.None,
        wyoOrder: CharactersOrderBy.Faction,
        showBadges: true,
        showAbilitiesLevel: true,
        showBsValue: false,
        showPower: true,
        showCharacterLevel: true,
        showCharacterRarity: true,
        inventoryShowAlphabet: true,
        inventoryShowPlusMinus: true,
        goalsTableView: false,
        lreGridView: false,
        lreTileShowUnitIcon: true,
        lreTileShowUnitRarity: true,
        lreTileShowUnitRank: true,
        lreTileShowUnitName: true,
        lreTileShowUnitRankBackground: true,
        lreTileShowUnitBias: true,
        lreTileShowUnitActiveAbility: true,
        lreTileShowUnitPassiveAbility: true,
        myProgressShowCoreCharacters: true,
        apiIntegrationSyncOptions: ['roster', 'inventory', 'campaignProgress', 'raidedLocations'],
    },
    dailyRaidsPreferences: {
        dailyEnergy: 288,
        shardsEnergy: 0,
        farmByPriorityOrder: false,
        farmStrategy: DailyRaidsStrategy.leastEnergy,
        campaignEvent: 'none',
    },
    mows: [],
    teams: [],
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
    campaignsProgress: defaultCampaignsProgress,
    inventory: {
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
};

export const goalsLimit = 50;

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
};
