import { Rank, Rarity, UnitType, RarityStars, RarityMapper } from '@/fsd/5-shared/model';

import { ICampaignsProgress } from '@/fsd/4-entities/campaign';
import { CharacterBias, CharactersService, ICharacter2 } from '@/fsd/4-entities/character';
import { IMow, IMow2, IMowDb, mowsData, MowsService } from '@/fsd/4-entities/mow';
import { CharactersPowerService } from '@/fsd/4-entities/unit/characters-power.service';
import { UpgradesService } from '@/fsd/4-entities/upgrade';

import { ILreProgressDto } from '@/fsd/3-features/lre-progress';
import { IPersonalTeam } from 'src/v2/features/teams/teams.models';

import { XpIncomeState } from '@/fsd/1-pages/input-xp-income';

import { defaultData, rankToLevel, rankToRarity } from './constants';
import {
    IAutoTeamsPreferences,
    IDailyRaids,
    IDailyRaidsPreferences,
    IGlobalState,
    IGuild,
    IGuildWar,
    IInsightsData,
    IInventory,
    ILegendaryEventSelectedRequirements,
    ILegendaryEventSelectedTeams,
    IPersonalCharacterData2,
    IPersonalData2,
    IPersonalGoal,
    ISelectedTeamsOrdering,
    IViewPreferences,
    LegendaryEventData,
} from './interfaces';

export class GlobalState implements IGlobalState {
    readonly modifiedDate?: Date;
    readonly seenAppVersion?: string | null;

    readonly autoTeamsPreferences: IAutoTeamsPreferences;
    readonly characters: Array<ICharacter2>;
    readonly viewPreferences: IViewPreferences;
    readonly dailyRaidsPreferences: IDailyRaidsPreferences;
    readonly selectedTeamOrder: ISelectedTeamsOrdering;
    readonly leSelectedRequirements: LegendaryEventData<ILegendaryEventSelectedRequirements>;
    readonly goals: IPersonalGoal[];
    readonly teams: IPersonalTeam[];
    readonly leProgress: LegendaryEventData<ILreProgressDto>;
    readonly leSelectedTeams: LegendaryEventData<ILegendaryEventSelectedTeams>;
    readonly campaignsProgress: ICampaignsProgress;
    readonly inventory: IInventory;
    readonly dailyRaids: IDailyRaids;
    readonly guildWar: IGuildWar;
    readonly guild: IGuild;
    readonly xpIncomeState: XpIncomeState;
    readonly mows: Array<IMow | IMow2>;

    constructor(personalData: IPersonalData2) {
        this.viewPreferences = personalData.viewPreferences ?? defaultData.viewPreferences;
        this.autoTeamsPreferences = personalData.autoTeamsPreferences ?? defaultData.autoTeamsPreferences;
        this.dailyRaidsPreferences = personalData.dailyRaidsPreferences ?? defaultData.dailyRaidsPreferences;

        this.selectedTeamOrder = personalData.selectedTeamOrder;
        this.leSelectedRequirements = personalData.leSelectedRequirements;
        this.leSelectedTeams = personalData.leTeams;
        this.leProgress = personalData.leProgress;
        const chars = personalData.characters;
        this.characters = GlobalState.initCharacters(chars);
        this.mows = GlobalState.initMows(personalData.mows);

        this.goals = personalData.goals.map((goal, index) => {
            const relatedChar = this.characters.find(x => x.name === goal.character);
            return { ...goal, priority: index + 1, currentRank: relatedChar?.rank, currentRarity: relatedChar?.rarity };
        });

        this.modifiedDate = personalData.modifiedDate;
        this.seenAppVersion = personalData.seenAppVersion;
        this.campaignsProgress = personalData.campaignsProgress ?? defaultData.campaignsProgress;
        this.inventory = personalData.inventory ?? defaultData.inventory;
        this.dailyRaids = personalData.dailyRaids ?? defaultData.dailyRaids;
        this.guildWar = personalData.guildWar ?? defaultData.guildWar;
        this.guild = personalData.guild ?? defaultData.guild;
        this.teams = personalData.teams ?? defaultData.teams;
        this.xpIncomeState = personalData.xpIncomeState ?? defaultData.xpIncomeState;
    }

    static initCharacters(
        chars: Partial<IPersonalCharacterData2 & IInsightsData>[],
        totalUsers?: number
    ): Array<ICharacter2> {
        return CharactersService.charactersData.map(staticData => {
            const personalCharData = chars.find(c => {
                return CharactersService.canonicalName(c.name!) === staticData.snowprintId!;
            });
            const rank = personalCharData?.rank ?? Rank.Locked;
            const rankLevel = rankToLevel[rank as Rank];
            const rankRarity = rankToRarity[rank];
            const rarity = Math.max(personalCharData?.rarity ?? staticData.initialRarity, rankRarity) as Rarity;
            const stars = Math.max(personalCharData?.stars ?? 0, RarityMapper.toStars[rarity]);
            const activeLevel = Math.max(personalCharData?.activeAbilityLevel ?? 1, 1);
            const passiveLevel = Math.max(personalCharData?.passiveAbilityLevel ?? 1, 1);
            const level = Math.max(personalCharData?.level ?? 1, rankLevel, activeLevel, passiveLevel);
            const upgrades = personalCharData?.upgrades
                ? personalCharData.upgrades.filter(UpgradesService.isValidUpgrade)
                : [];

            const combinedData: IPersonalCharacterData2 = {
                name: staticData.snowprintId!,
                rank: rank,
                rarity: rarity,
                bias: personalCharData?.bias ?? CharacterBias.None,
                upgrades: upgrades,
                activeAbilityLevel: activeLevel,
                passiveAbilityLevel: passiveLevel,
                stars: stars,
                level: level,
                xp: personalCharData?.xp ?? 0,
                shards: personalCharData?.shards ?? 0,
                mythicShards: personalCharData?.mythicShards ?? 0,
            };

            const result: ICharacter2 = {
                ...staticData,
                ...combinedData,
                rank: +combinedData.rank,
                numberOfUnlocked:
                    totalUsers && personalCharData?.numberOfUnlocked
                        ? Math.ceil((personalCharData.numberOfUnlocked / totalUsers) * 100)
                        : undefined,
                ownedBy: personalCharData?.ownedBy ?? [],
                statsByOwner: personalCharData?.statsByOwner ?? [],
            };

            result.power = CharactersPowerService.getCharacterPower(result);

            return result;
        });
    }

    static initMows(dbMows: Partial<IMowDb & IInsightsData>[], totalUsers?: number): Array<IMow> {
        return mowsData.map(staticData => {
            const dbMow = dbMows?.find(c => c.id === staticData.id);
            const initialRarity = RarityMapper.stringToNumber[staticData.initialRarity];
            const initialRarityStars = RarityMapper.toStars[RarityMapper.stringToNumber[staticData.initialRarity]];
            const isReleased = staticData.releaseDate
                ? this.isAtLeast3DaysBefore(new Date(staticData.releaseDate))
                : true;

            const result: IMow = {
                ...staticData,
                unitType: UnitType.mow,
                portraitIcon: isReleased ? `${staticData.id}.webp` : 'comingSoon.webp',
                badgeIcon: isReleased ? `${staticData.id}.png` : 'unset.png',
                rarity: dbMow?.rarity ?? initialRarity,
                stars: dbMow?.stars ?? initialRarityStars,
                primaryAbilityLevel: dbMow?.primaryAbilityLevel ?? 1,
                secondaryAbilityLevel: dbMow?.secondaryAbilityLevel ?? 1,
                unlocked: dbMow?.unlocked ?? false,
                shards: dbMow?.shards ?? 0,
                mythicShards: dbMow?.mythicShards ?? 0,
                numberOfUnlocked:
                    totalUsers && dbMow?.numberOfUnlocked
                        ? Math.ceil((dbMow.numberOfUnlocked / totalUsers) * 100)
                        : undefined,
                ownedBy: dbMow?.ownedBy ?? [],
                statsByOwner: dbMow?.statsByOwner ?? [],
            };

            const newStaticData = MowsService.resolveToStatic(staticData.id)!;
            const mow2: IMow2 = {
                ...newStaticData,
                ...result,
            };

            result.power = CharactersPowerService.getCharacterAbilityPower(mow2);

            return result;
        });
    }

    static isAtLeast3DaysBefore(releaseDate: Date): boolean {
        const today = new Date();

        // Calculate the difference in time
        const timeDifference = releaseDate.getTime() - today.getTime();

        // Convert time difference from milliseconds to days
        const dayDifference = timeDifference / (1000 * 3600 * 24);

        // Check if the day difference is less than or equal to 2
        return dayDifference <= 3;
    }

    static toStore(value: IGlobalState): IPersonalData2 {
        const charactersToStore: IPersonalCharacterData2[] = value.characters
            .filter(
                x =>
                    x.bias !== CharacterBias.None ||
                    x.rank !== Rank.Locked ||
                    x.rarity !== x.initialRarity ||
                    x.upgrades?.length ||
                    x.activeAbilityLevel ||
                    x.passiveAbilityLevel ||
                    x.stars !== RarityStars.None ||
                    x.level !== 1 ||
                    x.xp !== 0 ||
                    x.shards !== 0 ||
                    x.mythicShards !== 0
            )
            .map(x => ({
                name: x.name,
                rank: x.rank,
                rarity: x.rarity,
                bias: x.bias,
                upgrades: x.upgrades,
                activeAbilityLevel: x.activeAbilityLevel,
                passiveAbilityLevel: x.passiveAbilityLevel,
                stars: x.stars,
                level: x.level,
                xp: x.xp,
                shards: x.shards,
                mythicShards: x.mythicShards,
            }));

        const mowsToDb: IMowDb[] = value.mows.map(x => ({
            id: x.id,
            rarity: x.rarity,
            primaryAbilityLevel: x.primaryAbilityLevel,
            secondaryAbilityLevel: x.secondaryAbilityLevel,
            stars: x.stars,
            shards: x.shards,
            mythicShards: x.mythicShards ?? 0,
            unlocked: x.unlocked,
        }));

        return {
            schemaVersion: 2,
            modifiedDate: value.modifiedDate,
            seenAppVersion: value.seenAppVersion,
            goals: value.goals,
            selectedTeamOrder: value.selectedTeamOrder,
            leTeams: value.leSelectedTeams,
            leProgress: value.leProgress,
            leSelectedRequirements: value.leSelectedRequirements,
            characters: charactersToStore,
            mows: mowsToDb,
            autoTeamsPreferences: value.autoTeamsPreferences,
            viewPreferences: value.viewPreferences,
            dailyRaidsPreferences: value.dailyRaidsPreferences,
            campaignsProgress: value.campaignsProgress,
            inventory: value.inventory,
            dailyRaids: value.dailyRaids,
            guildWar: value.guildWar,
            guild: value.guild,
            xpIncomeState: value.xpIncomeState,
            teams: value.teams,
        };
    }
}
