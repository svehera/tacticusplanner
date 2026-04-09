import { Rank, Rarity, UnitType, RarityStars, RarityMapper } from '@/fsd/5-shared/model';

import { CampaignsService, ICampaignsProgress } from '@/fsd/4-entities/campaign';
import { CharacterBias, CharactersService, ICharacter2 } from '@/fsd/4-entities/character';
import { IMow, IMow2, IMowDatabase, mows2Data, mowsData, MowsService } from '@/fsd/4-entities/mow';
import { CharactersPowerService } from '@/fsd/4-entities/unit/characters-power.service';
import { UpgradesService } from '@/fsd/4-entities/upgrade';

import { ILreProgressDto } from '@/fsd/3-features/lre-progress';
import { IPersonalTeam } from '@/fsd/3-features/teams/teams.models';

import { XpUseState } from '@/fsd/1-pages/input-resources/models';
import { IRosterSnapshotsState } from '@/fsd/1-pages/input-roster-snapshots/models';
import { XpIncomeState } from '@/fsd/1-pages/input-xp-income';
import { ITeam2 } from '@/fsd/1-pages/plan-teams2/models';
import { WarDefense2State } from '@/fsd/1-pages/plan-war-defense-2/models';
import { WarOffense2State } from '@/fsd/1-pages/plan-war-offense2/models';

import { OnslaughtData } from '../services/onslaught-rewards-service';

import { defaultData, rankToLevel, rankToRarity } from './constants';
import {
    IAutoTeamsPreferences,
    IDailyRaids,
    IDailyRaidsStored,
    IDailyRaidsPreferences,
    IGlobalState,
    IGuild,
    IGuildWar,
    IInsightsData,
    IInventory,
    ILegendaryEventSelectedTeams, // This import is not related to the current issue and should remain.
    ILegendaryEventSettings,
    IPersonalCharacterData2,
    IPersonalData2,
    IPersonalGoal,
    ISelectedTeamsOrdering,
    IViewPreferences,
    IGameModeTokensState,
    LegendaryEventData,
} from './interfaces';

export class GlobalState implements IGlobalState {
    readonly modifiedDate?: Date;
    readonly seenAppVersion?: string;

    readonly autoTeamsPreferences: IAutoTeamsPreferences;
    readonly characters: Array<ICharacter2>;
    readonly viewPreferences: IViewPreferences;
    readonly dailyRaidsPreferences: IDailyRaidsPreferences;
    readonly selectedTeamOrder: ISelectedTeamsOrdering;
    readonly goals: IPersonalGoal[];
    readonly teams: IPersonalTeam[];
    readonly teams2: ITeam2[];
    readonly warDefense2: WarDefense2State;
    readonly warOffense2: WarOffense2State;
    readonly leProgress: LegendaryEventData<ILreProgressDto>;
    readonly leSelectedTeams: LegendaryEventData<ILegendaryEventSelectedTeams>;
    readonly leSettings: ILegendaryEventSettings;
    readonly campaignsProgress: ICampaignsProgress;
    readonly inventory: IInventory;
    readonly dailyRaids: IDailyRaids;
    readonly guildWar: IGuildWar;
    readonly guild: IGuild;
    readonly xpIncome: XpIncomeState;
    readonly xpUse: XpUseState;
    readonly rosterSnapshots: IRosterSnapshotsState;
    readonly mows: Array<IMow | IMow2>;
    readonly gameModeTokens: IGameModeTokensState;
    readonly honorYourHeroesRewards?: OnslaughtData;
    constructor(personalData: IPersonalData2) {
        this.viewPreferences = personalData.viewPreferences ?? defaultData.viewPreferences;
        this.autoTeamsPreferences = personalData.autoTeamsPreferences ?? defaultData.autoTeamsPreferences;
        this.dailyRaidsPreferences = personalData.dailyRaidsPreferences ?? defaultData.dailyRaidsPreferences;

        this.selectedTeamOrder = personalData.selectedTeamOrder;
        this.leSelectedTeams = personalData.leTeams;
        this.leProgress = personalData.leProgress;
        this.leSettings = personalData.leSettings;
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
        this.dailyRaids = GlobalState.restoreDailyRaids(personalData.dailyRaids);
        this.guildWar = personalData.guildWar ?? defaultData.guildWar;
        this.guild = personalData.guild ?? defaultData.guild;
        this.teams = personalData.teams ?? defaultData.teams;
        this.teams2 = personalData.teams2 ?? defaultData.teams2;
        this.warDefense2 = personalData.warDefense2 ?? defaultData.warDefense2;
        this.warOffense2 = personalData.warOffense2 ?? defaultData.warOffense2;
        this.xpIncome = personalData.xpIncome ?? defaultData.xpIncome;
        this.xpUse = personalData.xpUse ?? defaultData.xpUse;
        this.rosterSnapshots = personalData.rosterSnapshots ?? defaultData.rosterSnapshots;
        this.gameModeTokens = personalData.gameModeTokens ?? defaultData.gameModeTokens;
        this.honorYourHeroesRewards = personalData.honorYourHeroesRewards ?? defaultData.honorYourHeroesRewards;
    }

    static initCharacters(
        chars: Partial<IPersonalCharacterData2 & IInsightsData>[],
        totalUsers?: number
    ): Array<ICharacter2> {
        return CharactersService.charactersData.map(staticData => {
            const personalCharData = chars.find(c => {
                return CharactersService.canonicalName(c.name!) === staticData.snowprintId;
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
                ? personalCharData.upgrades.filter(upgrade => UpgradesService.isValidUpgrade(upgrade))
                : [];

            const combinedData: IPersonalCharacterData2 = {
                name: staticData.snowprintId,
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
                equipment: personalCharData?.equipment ?? [],
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

    static initMows(databaseMows: Partial<IMowDatabase & IInsightsData>[], totalUsers?: number): Array<IMow | IMow2> {
        const returnValue = mowsData.map(staticData => {
            const databaseMow = databaseMows?.find(c => c.id === staticData.id);
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
                rarity: databaseMow?.rarity ?? initialRarity,
                stars: databaseMow?.stars ?? initialRarityStars,
                primaryAbilityLevel: databaseMow?.primaryAbilityLevel ?? 1,
                secondaryAbilityLevel: databaseMow?.secondaryAbilityLevel ?? 1,
                unlocked: databaseMow?.unlocked ?? false,
                shards: databaseMow?.shards ?? 0,
                mythicShards: databaseMow?.mythicShards ?? 0,
                numberOfUnlocked:
                    totalUsers && databaseMow?.numberOfUnlocked
                        ? Math.ceil((databaseMow.numberOfUnlocked / totalUsers) * 100)
                        : undefined,
                ownedBy: databaseMow?.ownedBy ?? [],
                statsByOwner: databaseMow?.statsByOwner ?? [],
            };

            const newStaticData = MowsService.resolveToStatic(staticData.id)!;
            const mow2: IMow2 = {
                ...newStaticData,
                ...result,
            };

            result.power = CharactersPowerService.getCharacterAbilityPower(mow2);

            return result;
        }) as Array<IMow | IMow2>;
        for (const staticMow of mows2Data.mows) {
            if (
                returnValue.some(
                    x =>
                        ('tacticusId' in x && x.tacticusId === staticMow.snowprintId) ||
                        ('snowprintId' in x && x.snowprintId === staticMow.snowprintId)
                )
            )
                continue;
            const databaseMow = databaseMows?.find(c => c.id === staticMow.snowprintId);

            const result: IMow2 = {
                ...staticMow,
                id: staticMow.snowprintId,
                unitType: UnitType.mow,
                icon: staticMow.icon,
                rarity: databaseMow?.rarity ?? Rarity.Common,
                stars: databaseMow?.stars ?? RarityStars.None,
                primaryAbilityLevel: databaseMow?.primaryAbilityLevel ?? 1,
                secondaryAbilityLevel: databaseMow?.secondaryAbilityLevel ?? 1,
                unlocked: databaseMow?.unlocked ?? false,
                shards: databaseMow?.shards ?? 0,
                mythicShards: databaseMow?.mythicShards ?? 0,
                numberOfUnlocked:
                    totalUsers && databaseMow?.numberOfUnlocked
                        ? Math.ceil((databaseMow.numberOfUnlocked / totalUsers) * 100)
                        : undefined,
                ownedBy: databaseMow?.ownedBy ?? [],
                statsByOwner: databaseMow?.statsByOwner ?? [],
            };

            result.power = CharactersPowerService.getCharacterAbilityPower({
                ...staticMow,
                ...result,
            } as IMow2);

            returnValue.push(result);
        }
        return returnValue;
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
                    x.mythicShards !== 0 ||
                    x.equipment?.length
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
                equipment: x.equipment,
            }));

        const mowsToDatabase: IMowDatabase[] = value.mows.map(x => ({
            id: x.id,
            rarity: x.rarity,
            primaryAbilityLevel: x.primaryAbilityLevel,
            secondaryAbilityLevel: x.secondaryAbilityLevel,
            stars: x.stars,
            shards: x.shards,
            mythicShards: x.mythicShards ?? 0,
            unlocked: x.unlocked,
        }));

        const leTeamsToStore: LegendaryEventData<ILegendaryEventSelectedTeams> = {};
        for (const eventId in value.leSelectedTeams) {
            const eventTeams = value.leSelectedTeams[eventId as unknown as keyof typeof value.leSelectedTeams];
            if (!eventTeams) {
                continue;
            }

            leTeamsToStore[eventId as unknown as keyof LegendaryEventData<ILegendaryEventSelectedTeams>] = {
                ...eventTeams,
                teams: (eventTeams.teams ?? []).map(team => {
                    let teamCharIds: string[] = team.charSnowprintIds ?? [];
                    if ((team.characters?.length ?? 0) > 0 && (team.charSnowprintIds?.length ?? 0) === 0) {
                        teamCharIds = team.characters?.map(char => char.snowprintId) ?? [];
                    } else if (teamCharIds.length === 0 && team.charactersIds !== undefined) {
                        teamCharIds = team.charactersIds;
                    }
                    const charSnowprintIds = teamCharIds.map(id => CharactersService.canonicalName(id));

                    const returnValue = {
                        ...team,
                        charSnowprintIds,
                        charactersIds: [],
                        characters: undefined,
                    };
                    delete returnValue.characters;
                    return returnValue;
                }),
            };
        }

        return {
            schemaVersion: 2,
            modifiedDate: value.modifiedDate,
            seenAppVersion: value.seenAppVersion,
            goals: value.goals,
            selectedTeamOrder: value.selectedTeamOrder,
            leTeams: leTeamsToStore,
            leProgress: value.leProgress,
            leSettings: value.leSettings,
            characters: charactersToStore,
            mows: mowsToDatabase,
            autoTeamsPreferences: value.autoTeamsPreferences,
            viewPreferences: value.viewPreferences,
            dailyRaidsPreferences: value.dailyRaidsPreferences,
            campaignsProgress: value.campaignsProgress,
            inventory: value.inventory,
            dailyRaids: GlobalState.toStoredDailyRaids(value.dailyRaids),
            guildWar: value.guildWar,
            guild: value.guild,
            xpIncome: value.xpIncome,
            xpUse: value.xpUse,
            rosterSnapshots: value.rosterSnapshots,
            gameModeTokens: value.gameModeTokens,
            teams: value.teams,
            teams2: value.teams2,
            warDefense2: value.warDefense2,
            warOffense2: value.warOffense2,
        };
    }

    private static toStoredDailyRaids(dailyRaids: IDailyRaids): IDailyRaidsStored {
        return {
            ...dailyRaids,
            raidedLocations: dailyRaids.raidedLocations.map(location => ({
                id: location.id,
                raidsAlreadyPerformed: location.raidsAlreadyPerformed,
                raidsToPerform: location.raidsToPerform,
            })),
        };
    }

    private static restoreDailyRaids(dailyRaids: IDailyRaids | IDailyRaidsStored | undefined): IDailyRaids {
        if (!dailyRaids) {
            return defaultData.dailyRaids as IDailyRaids;
        }

        const byId = new Map(Object.values(CampaignsService.campaignsComposed).map(battle => [battle.id, battle]));
        const raidedLocations = dailyRaids.raidedLocations
            .map(location => {
                if ('campaign' in location) {
                    return location;
                }

                const baseBattle = byId.get(location.id);
                if (!baseBattle) {
                    return;
                }

                const raidsAlreadyPerformed = location.raidsAlreadyPerformed ?? 0;
                const raidsToPerform = location.raidsToPerform ?? 0;
                const totalRaids = raidsAlreadyPerformed + raidsToPerform;
                return {
                    ...baseBattle,
                    raidsAlreadyPerformed,
                    raidsToPerform,
                    energySpent: totalRaids * baseBattle.energyCost,
                    farmedItems: totalRaids * baseBattle.dropRate,
                    isShardsLocation: baseBattle.rarity === 'Shard' || baseBattle.rarity === 'Mythic Shard',
                    isCompleted: raidsAlreadyPerformed >= baseBattle.dailyBattleCount,
                };
            })
            .filter(location => !!location);

        return {
            ...(defaultData.dailyRaids as IDailyRaids),
            ...dailyRaids,
            raidedLocations,
        };
    }
}
