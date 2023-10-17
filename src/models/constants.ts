import { LegendaryEventEnum, PersonalGoalType, Rank, Rarity, RarityStars, RarityString } from './enums';
import { ICharacter2, ICharProgression, IPersonalData2 } from './interfaces';
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

export const discordInvitationLink = 'https://discord.gg/B2ze6w7gx';

export const defaultData: IPersonalData2 = {
    schemaVersion: 2,
    modifiedDate: undefined,
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
    characters: [
        {
            name: 'Varro Tigurius',
            unlocked: true,
        },
        {
            name: 'Certus',
            unlocked: true,
        },
        {
            name: 'Bellator',
            unlocked: true,
        },
        {
            name: 'Incisus',
            unlocked: true,
        },
        {
            name: 'Vindicta',
            unlocked: true,
        },
    ],
    goals: [
        {
            id: 'de3bd0bb-d583-40d2-9789-f692bf60d596',
            character: 'Bellator',
            type: PersonalGoalType.Ascend,
            targetRarity: Rarity.Rare,
            priority: 1,
        },
        {
            id: 'dc050dcb-bb66-4bbe-9476-c1f5bd291e74',
            character: 'Certus',
            type: PersonalGoalType.Ascend,
            targetRarity: Rarity.Rare,
            priority: 2,
        },
        {
            id: '552c3f54-fae9-47a6-8c99-e10e6c1c3d32',
            character: 'Varro Tigurius',
            type: PersonalGoalType.Ascend,
            targetRarity: Rarity.Rare,
            priority: 3,
        },
        {
            id: 'aaaac20d-22eb-48e8-9fe5-f06c01dadf0f',
            character: 'Bellator',
            type: PersonalGoalType.UpgradeRank,
            targetRank: Rank.Silver1,
            priority: 4,
        },
        {
            id: '22dff600-4820-42a7-8050-973842242f76',
            character: 'Certus',
            type: PersonalGoalType.UpgradeRank,
            targetRank: Rank.Silver1,
            priority: 5,
        },
        {
            id: '2221c67e-b1f7-4436-9981-d8f084922aa0',
            character: 'Varro Tigurius',
            type: PersonalGoalType.UpgradeRank,
            targetRank: Rank.Silver1,
            priority: 6,
        },
    ],
    selectedTeamOrder: {
        orderBy: 'name',
        direction: 'asc',
    },
    leTeams: {},
    leProgress: {},
    leSelectedRequirements: {},
};
