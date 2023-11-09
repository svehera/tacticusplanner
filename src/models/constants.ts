import { DailyEnergy, LegendaryEventEnum, PersonalGoalType, Rank, Rarity, RarityStars, RarityString } from './enums';
import { ICampaignsProgress, ICharacter2, ICharProgression, IPersonalData2 } from './interfaces';
import { AunShiLegendaryEvent, ShadowSunLegendaryEvent } from './legendary-events';
import { RagnarLegendaryEvent } from './legendary-events/ragnar.le';

export const rarityStringToNumber: Record<RarityString, Rarity> = {
    [RarityString.Common]: Rarity.Common,
    [RarityString.Uncommon]: Rarity.Uncommon,
    [RarityString.Rare]: Rarity.Rare,
    [RarityString.Epic]: Rarity.Epic,
    [RarityString.Legendary]: Rarity.Legendary,
};

export const rarityToStars: Record<Rarity, RarityStars> = {
    [Rarity.Common]: RarityStars.OneStar,
    [Rarity.Uncommon]: RarityStars.TwoStars,
    [Rarity.Rare]: RarityStars.FourStarts,
    [Rarity.Epic]: RarityStars.RedOneStar,
    [Rarity.Legendary]: RarityStars.RedThreeStarts,
};

export const charsProgression: Record<number, ICharProgression> = {
    [Rarity.Common + RarityStars.OneStar]: { shards: 10 },
    [Rarity.Common + RarityStars.TwoStars]: { shards: 15 },
    [Rarity.Uncommon + RarityStars.TwoStars]: { shards: 15, orbs: 10, rarity: Rarity.Uncommon },

    [Rarity.Uncommon + RarityStars.ThreeStarts]: { shards: 15 },
    [Rarity.Uncommon + RarityStars.FourStarts]: { shards: 15 },
    [Rarity.Rare + RarityStars.FourStarts]: { shards: 20, orbs: 10, rarity: Rarity.Rare },

    [Rarity.Rare + RarityStars.FiveStarts]: { shards: 30 },
    [Rarity.Rare + RarityStars.RedOneStar]: { shards: 40 },
    [Rarity.Epic + RarityStars.RedOneStar]: { shards: 50, orbs: 10, rarity: Rarity.Epic },

    [Rarity.Epic + RarityStars.RedTwoStarts]: { shards: 65 },
    [Rarity.Epic + RarityStars.RedThreeStarts]: { shards: 85 },
    [Rarity.Legendary + RarityStars.RedThreeStarts]: { shards: 100, orbs: 10, rarity: Rarity.Legendary },

    [Rarity.Legendary + RarityStars.RedFourStarts]: { shards: 65, orbs: 10, rarity: Rarity.Legendary },
    [Rarity.Legendary + RarityStars.RedFiveStarts]: { shards: 85, orbs: 15, rarity: Rarity.Legendary },
    [Rarity.Legendary + RarityStars.DiamondStar]: { shards: 100, orbs: 15, rarity: Rarity.Legendary },
};

export const charsUnlockShards: Record<Rarity, number> = {
    [Rarity.Common]: 40,
    [Rarity.Uncommon]: 80,
    [Rarity.Rare]: 130,
    [Rarity.Epic]: 250,
    [Rarity.Legendary]: 500,
};

export const defaultLE = LegendaryEventEnum.Shadowsun;
export const getLegendaryEvent = (id: LegendaryEventEnum, characters: ICharacter2[]) => {
    switch (id) {
        case LegendaryEventEnum.Shadowsun:
            return new ShadowSunLegendaryEvent(characters);
        case LegendaryEventEnum.AunShi:
            return new AunShiLegendaryEvent(characters);
        case LegendaryEventEnum.Ragnar:
            return new RagnarLegendaryEvent(characters);
        default:
            return new ShadowSunLegendaryEvent(characters);
    }
};
export const isTabletOrMobileMediaQuery = '(max-width: 1000px)';

export const pooEmoji = String.fromCodePoint(parseInt('1F4A9', 16));
export const starEmoji = String.fromCodePoint(parseInt('1F31F', 16));

export const discordInvitationLink = 'https://discord.gg/gyajsMcH7j';

export const dailyEnergyOptions: Record<DailyEnergy, number> = {
    [DailyEnergy.Base]: 288,
    [DailyEnergy.Adv]: 288 + 50,
    [DailyEnergy.BS50]: 288 + 50 + 100,
    [DailyEnergy.BS110]: 288,
};

export const defaultCampaignsProgress: ICampaignsProgress = {
    Indomitus: 75,
    'Indomitus Mirror': 75,
    'Indomitus Elite': 40,
    'Indomitus Mirror Elite': 40,

    'Fall of Cadia': 75,
    'Fall of Cadia Mirror': 75,
    'Fall of Cadia Elite': 40,
    'Fall of Cadia Mirror Elite': 40,

    Octarius: 75,
    'Octarius Mirror': 75,
    'Octarius Elite': 40,

    'Saim-Hann': 75,
};

export const campaignsNames: Array<keyof ICampaignsProgress> = Object.keys(defaultCampaignsProgress) as Array<
    keyof ICampaignsProgress
>;

export const defaultData: IPersonalData2 = {
    schemaVersion: 2,
    modifiedDate: undefined,
    seenAppVersion: undefined,
    dailyRaids: {
        completedBattles: [],
    },
    autoTeamsPreferences: {
        preferCampaign: false,
        ignoreRank: false,
        ignoreRarity: false,
        ignoreRecommendedFirst: false,
        ignoreRecommendedLast: false,
    },
    viewPreferences: {
        showAlpha: true,
        showBeta: true,
        showGamma: true,
        lightWeight: false,
        hideSelectedTeams: false,
        autoTeams: true,
        onlyUnlocked: false,
    },
    dailyRaidsPreferences: {
        dailyEnergy: 288,
        shardsEnergy: 0,
        useCampaignsProgress: true,
        useMostEfficientNodes: true,
        useMoreEfficientNodes: false,
        useLeastEfficientNodes: false,
        useInventory: true,
    },
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
            id: 'de3bd0bb-d583-40d2-9789-f692bf60d596',
            character: 'Bellator',
            type: PersonalGoalType.Ascend,
            targetRarity: Rarity.Rare,
            priority: 1,
            upgrades: [],
            dailyRaids: true,
        },
        {
            id: 'dc050dcb-bb66-4bbe-9476-c1f5bd291e74',
            character: 'Certus',
            type: PersonalGoalType.Ascend,
            targetRarity: Rarity.Rare,
            priority: 2,
            upgrades: [],
            dailyRaids: true,
        },
        {
            id: '552c3f54-fae9-47a6-8c99-e10e6c1c3d32',
            character: 'Varro Tigurius',
            type: PersonalGoalType.Ascend,
            targetRarity: Rarity.Rare,
            priority: 3,
            upgrades: [],
            dailyRaids: true,
        },
        {
            id: 'aaaac20d-22eb-48e8-9fe5-f06c01dadf0f',
            character: 'Bellator',
            type: PersonalGoalType.UpgradeRank,
            targetRank: Rank.Silver1,
            priority: 4,
            upgrades: [],
            dailyRaids: true,
        },
        {
            id: '22dff600-4820-42a7-8050-973842242f76',
            character: 'Certus',
            type: PersonalGoalType.UpgradeRank,
            targetRank: Rank.Silver1,
            priority: 5,
            upgrades: [],
            dailyRaids: true,
        },
        {
            id: '2221c67e-b1f7-4436-9981-d8f084922aa0',
            character: 'Varro Tigurius',
            type: PersonalGoalType.UpgradeRank,
            targetRank: Rank.Silver1,
            priority: 6,
            upgrades: [],
            dailyRaids: true,
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
};
