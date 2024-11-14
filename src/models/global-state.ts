import {
    IAutoTeamsPreferences,
    ICampaignsProgress,
    ICharacter2,
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
import { StaticDataService } from '../services';
import { CharacterBias, LegendaryEventEnum, Rank, Rarity, RarityStars } from './enums';
import { defaultData, rankToLevel, rankToRarity, rarityStringToNumber, rarityToStars } from './constants';
import { IMow, IMowDb, IMowStatic } from 'src/v2/features/characters/characters.models';
import mowsData from 'src/v2/data/mows.json';
import { UnitType } from 'src/v2/features/characters/units.enums';
import { IPersonalTeam } from 'src/v2/features/teams/teams.models';
import { CharactersPowerService } from 'src/v2/features/characters/characters-power.service';
import { ILreProgressDto } from 'src/models/dto.interfaces';

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
    readonly mows: IMow[];

    constructor(personalData: IPersonalData2) {
        this.viewPreferences = personalData.viewPreferences ?? defaultData.viewPreferences;
        this.autoTeamsPreferences = personalData.autoTeamsPreferences ?? defaultData.autoTeamsPreferences;
        this.dailyRaidsPreferences = personalData.dailyRaidsPreferences ?? defaultData.dailyRaidsPreferences;

        this.selectedTeamOrder = personalData.selectedTeamOrder;
        this.leSelectedRequirements = personalData.leSelectedRequirements;
        this.leSelectedTeams = GlobalState.fixNames(personalData.leTeams);
        this.leProgress = personalData.leProgress;
        const chars = GlobalState.fixNames(personalData.characters);
        this.characters = GlobalState.initCharacters(chars);
        this.mows = GlobalState.initMows(personalData.mows);

        this.goals = GlobalState.fixNames(personalData.goals).map((goal, index) => {
            const relatedChar = this.characters.find(x => x.name === goal.character);
            return { ...goal, priority: index + 1, currentRank: relatedChar?.rank, currentRarity: relatedChar?.rarity };
        });

        this.modifiedDate = personalData.modifiedDate;
        this.seenAppVersion = personalData.seenAppVersion;
        this.campaignsProgress = personalData.campaignsProgress ?? defaultData.campaignsProgress;
        this.inventory = GlobalState.fixNames(personalData.inventory ?? defaultData.inventory);
        this.dailyRaids = personalData.dailyRaids ?? defaultData.dailyRaids;
        this.guildWar = personalData.guildWar ?? defaultData.guildWar;
        this.guild = personalData.guild ?? defaultData.guild;
        this.teams = personalData.teams ?? defaultData.teams;
    }

    static initCharacters(
        chars: Partial<IPersonalCharacterData2 & IInsightsData>[],
        totalUsers?: number
    ): Array<ICharacter2> {
        return StaticDataService.unitsData.map(staticData => {
            const personalCharData = chars.find(c => c.name === staticData.name);
            const rank = personalCharData?.rank ?? Rank.Locked;
            const rankLevel = rankToLevel[(rank - 1) as Rank];
            const rankRarity = rankToRarity[rank];
            const rarity = Math.max(personalCharData?.rarity ?? staticData.initialRarity, rankRarity) as Rarity;
            const stars = Math.max(personalCharData?.stars ?? 0, rarityToStars[rarity]);
            const activeLevel = Math.max(personalCharData?.activeAbilityLevel ?? 1, 1);
            const passiveLevel = Math.max(personalCharData?.passiveAbilityLevel ?? 1, 1);
            const level = Math.max(personalCharData?.level ?? 1, rankLevel, activeLevel, passiveLevel);
            const upgrades = personalCharData?.upgrades
                ? personalCharData.upgrades.filter(StaticDataService.isValidaUpgrade)
                : [];

            const combinedData: IPersonalCharacterData2 = {
                name: staticData.name,
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
        const mowsStatic = mowsData as IMowStatic[];
        return mowsStatic.map(staticData => {
            const dbMow = dbMows?.find(c => c.id === staticData.id);
            const initialRarity = rarityStringToNumber[staticData.initialRarity];
            const initialRarityStars = rarityToStars[rarityStringToNumber[staticData.initialRarity]];
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
                numberOfUnlocked:
                    totalUsers && dbMow?.numberOfUnlocked
                        ? Math.ceil((dbMow.numberOfUnlocked / totalUsers) * 100)
                        : undefined,
                ownedBy: dbMow?.ownedBy ?? [],
                statsByOwner: dbMow?.statsByOwner ?? [],
            };

            result.power = CharactersPowerService.getCharacterAbilityPower(result);

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

    static fixNames<T>(obj: T): T {
        const fixName = {
            'Abaddon The Despolier': 'Abaddon The Despoiler',
            'Actus Folgorosus': 'Actus',
            'Blessed Tabard': 'Blessed Tabbard',
        };

        let result = JSON.stringify(obj);

        for (const fixNameKey in fixName) {
            const value = fixName[fixNameKey as keyof typeof fixName];
            result = result.replaceAll(fixNameKey, value);
        }

        return JSON.parse(result);
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
                    x.shards !== 0
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
            }));

        const mowsToDb: IMowDb[] = value.mows.map(x => ({
            id: x.id,
            rarity: x.rarity,
            primaryAbilityLevel: x.primaryAbilityLevel,
            secondaryAbilityLevel: x.secondaryAbilityLevel,
            stars: x.stars,
            shards: x.shards,
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
            teams: value.teams,
        };
    }
}
