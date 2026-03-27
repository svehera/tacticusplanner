import { v4 } from 'uuid';

import { Rank } from '@/fsd/5-shared/model';

import { CharactersService } from '@/fsd/4-entities/character';
import { LegendaryEventEnum, LreTrackId } from '@/fsd/4-entities/lre';

import { IMowDatabase } from '@/fsd/3-features/characters/characters.models';
import { getLre } from '@/fsd/3-features/lre';
import {
    ILreProgressDto,
    ILreBattleProgressDto,
    ILreRequirementsProgressDto,
    LrePointsCategoryId,
    battlesProgressToCompact,
} from '@/fsd/3-features/lre-progress';
import { IPersonalTeam } from '@/fsd/3-features/teams/teams.models';

import { XpUseState } from '@/fsd/1-pages/input-resources/models';
import { IRosterSnapshotsState } from '@/fsd/1-pages/input-roster-snapshots/models';
import { XpIncomeState } from '@/fsd/1-pages/input-xp-income/models';
import { ITeam2 } from '@/fsd/1-pages/plan-teams2/models';
import { WarDefense2State } from '@/fsd/1-pages/plan-war-defense-2/models';
import { WarOffense2State } from '@/fsd/1-pages/plan-war-offense2/models';

import { defaultData } from '../models/constants';
import {
    IAutoTeamsPreferences,
    ICampaignsProgress,
    IDailyRaids,
    IDailyRaidsStored,
    IDailyRaidsPreferences,
    IInventory,
    ILegendaryEventSelectedRequirements,
    ILegendaryEventSelectedTeams,
    IPersonalCharacterData2,
    IPersonalData,
    IPersonalData2,
    IPersonalGoal,
    IGuildWar,
    ISelectedTeamsOrdering,
    IViewPreferences,
    LegendaryEventData,
    IGuild,
    ILreTeam,
    SelectedTeams,
    ILegendaryEventSettings,
    IGameModeTokensState,
} from '../models/interfaces';

export class PersonalDataLocalStorage {
    private readonly storePrefix = 'tp-';
    private readonly backupKey = this.storePrefix + 'backup';
    private readonly backUpDateKey = this.storePrefix + 'backup-date';
    private readonly v1personalDataStorageKey = 'personalData';
    private readonly schemaVersionStorageKey = 'schemaVersion';

    private readonly storeKeys = Object.keys(defaultData) as Array<keyof IPersonalData2>;

    getData(): IPersonalData2 {
        let result = defaultData;
        const version = this.getItem<number>(this.schemaVersionStorageKey);
        if (version === 2) {
            const modifiedDateString = this.getItem<string>('modifiedDate');
            result = {
                schemaVersion: 2,
                modifiedDate: modifiedDateString ? new Date(modifiedDateString) : defaultData.modifiedDate,
                seenAppVersion: this.getItem<string>('seenAppVersion') ?? defaultData.seenAppVersion,
                autoTeamsPreferences: {
                    ...defaultData.autoTeamsPreferences,
                    ...this.getItem<IAutoTeamsPreferences>('autoTeamsPreferences'),
                },
                dailyRaidsPreferences: {
                    ...defaultData.dailyRaidsPreferences,
                    ...this.getItem<IDailyRaidsPreferences>('dailyRaidsPreferences'),
                },
                viewPreferences: {
                    ...defaultData.viewPreferences,
                    ...this.getItem<IViewPreferences>('viewPreferences'),
                },
                characters: this.getItem<IPersonalCharacterData2[]>('characters') ?? defaultData.characters,
                mows: this.getItem<IMowDatabase[]>('mows') ?? defaultData.mows,
                teams: this.getItem<IPersonalTeam[]>('teams') ?? defaultData.teams,
                teams2: this.getItem<ITeam2[]>('teams2') ?? defaultData.teams2,
                warDefense2: this.getItem<WarDefense2State>('warDefense2') ?? defaultData.warDefense2,
                warOffense2: this.getItem<WarOffense2State>('warOffense2') ?? defaultData.warOffense2,
                goals: this.getItem<IPersonalGoal[]>('goals') ?? defaultData.goals,
                selectedTeamOrder:
                    this.getItem<ISelectedTeamsOrdering>('selectedTeamOrder') ?? defaultData.selectedTeamOrder,
                leTeams: migrateLreTeams(
                    this.getItem<LegendaryEventData<ILegendaryEventSelectedTeams>>('leTeams') ?? defaultData.leTeams
                ),
                leProgress: migrateLreProgress(
                    this.getItem<LegendaryEventData<ILreProgressDto>>('leProgress') ?? defaultData.leProgress
                ),
                leSelectedRequirements:
                    this.getItem<LegendaryEventData<ILegendaryEventSelectedRequirements>>('leSelectedRequirements') ??
                    defaultData.leSelectedRequirements,
                leSettings: this.getItem<ILegendaryEventSettings>('leSettings') ?? defaultData.leSettings,
                campaignsProgress: {
                    ...defaultData.campaignsProgress,
                    ...this.getItem<ICampaignsProgress>('campaignsProgress'),
                },
                inventory: {
                    ...defaultData.inventory,
                    ...this.getItem<IInventory>('inventory'),
                },
                dailyRaids: {
                    ...defaultData.dailyRaids,
                    ...this.getItem<IDailyRaids | IDailyRaidsStored>('dailyRaids'),
                },
                guildWar: {
                    ...defaultData.guildWar,
                    ...this.getItem<IGuildWar>('guildWar'),
                },
                guild: {
                    ...defaultData.guild,
                    ...this.getItem<IGuild>('guild'),
                },
                xpIncome: {
                    ...defaultData.xpIncome,
                    ...this.getItem<XpIncomeState>('xpIncome'),
                },
                xpUse: {
                    ...defaultData.xpUse,
                    ...this.getItem<XpUseState>('xpUse'),
                },
                rosterSnapshots: {
                    ...defaultData.rosterSnapshots,
                    ...(this.getItem<IRosterSnapshotsState>('rosterSnapshots') ?? defaultData.rosterSnapshots),
                },
                gameModeTokens: {
                    ...defaultData.gameModeTokens,
                    ...(this.getItem<IGameModeTokensState>('gameModeTokens') ?? defaultData.gameModeTokens),
                },
            };
        } else {
            // no version (convert v1 to v2)
            const v1StoredData = localStorage.getItem(this.v1personalDataStorageKey);
            if (v1StoredData) {
                try {
                    const v1Data: IPersonalData | IPersonalData2 = JSON.parse(v1StoredData);
                    result = convertData(v1Data);
                } catch {
                    result = defaultData;
                }
            } else {
                result = defaultData;
            }
        }
        return result;
    }

    setData(data: Partial<IPersonalData2>): void {
        for (const dataKey in data) {
            const storeKey = this.storeKeys.find(x => x === dataKey);
            if (storeKey) {
                const value = data[storeKey];
                if (value) {
                    this.setItem(storeKey, value);
                }
            }
        }

        localStorage.removeItem(this.v1personalDataStorageKey);
    }

    restoreData(): IPersonalData2 | undefined {
        const backup = localStorage.getItem(this.backupKey);
        if (!backup) return;
        try {
            const data: IPersonalData | IPersonalData2 = JSON.parse(backup);
            return convertData(data);
        } catch {
            return;
        }
    }

    public storeBackup(data: IPersonalData2): void {
        const serialized = JSON.stringify(data);
        localStorage.setItem(this.backupKey, serialized);
        localStorage.setItem(this.backUpDateKey, new Date().toISOString());
    }

    public getBackupDate(): Date | undefined {
        const date = localStorage.getItem(this.backUpDateKey);
        if (!date) {
            return;
        }

        return new Date(date);
    }

    private getItem<T>(key: keyof IPersonalData2): T | undefined {
        const value = localStorage.getItem(this.storePrefix + key);

        if (!value) {
            return;
        }

        try {
            return JSON.parse(value);
        } catch {
            return;
        }
    }

    private setItem<T>(key: keyof IPersonalData2, item: T): void {
        const value = JSON.stringify(item);

        localStorage.setItem(this.storePrefix + key, value);
    }

    public static fixGoals(data: IPersonalData2): void {
        for (const goal of data.goals) {
            const resolvedChar = CharactersService.resolveCharacter(goal.character);
            if (!resolvedChar) {
                console.error('could not resolve character in goal', goal);
            }
            goal.character = resolvedChar.name;
        }
    }
}

export const convertData = (v1Data: IPersonalData | IPersonalData2): IPersonalData2 => {
    if (isV1Data(v1Data)) {
        return {
            schemaVersion: 2,
            modifiedDate: v1Data.modifiedDate ? new Date(v1Data.modifiedDate) : defaultData.modifiedDate,
            autoTeamsPreferences: {
                ...defaultData.autoTeamsPreferences,
                ...v1Data.autoTeamsPreferences,
            },
            viewPreferences: {
                ...defaultData.viewPreferences,
                ...v1Data.viewPreferences,
            },
            characters:
                v1Data.characters.map(x => ({
                    name: x.name,
                    rarity: x.rarity,
                    bias: x.bias,
                    rank: x.unlocked ? x.rank : Rank.Locked,
                })) ?? defaultData.characters,
            goals: v1Data.goals ?? defaultData.goals,
            selectedTeamOrder: v1Data.selectedTeamOrder ?? defaultData.selectedTeamOrder,
            leTeams: migrateLreTeams(v1Data.legendaryEvents3 ?? defaultData.leTeams),
            leProgress: v1Data.legendaryEventsProgress ?? defaultData.leProgress,
            leSelectedRequirements: v1Data.legendaryEventSelectedRequirements ?? defaultData.leSelectedRequirements,
            leSettings: defaultData.leSettings,
            campaignsProgress: defaultData.campaignsProgress,
            dailyRaidsPreferences: defaultData.dailyRaidsPreferences,
            inventory: defaultData.inventory,
            dailyRaids: defaultData.dailyRaids,
            guildWar: defaultData.guildWar,
            guild: defaultData.guild,
            mows: defaultData.mows,
            xpIncome: defaultData.xpIncome,
            xpUse: defaultData.xpUse,
            teams: defaultData.teams,
            teams2: defaultData.teams2,
            warDefense2: defaultData.warDefense2,
            warOffense2: defaultData.warOffense2,
            rosterSnapshots: defaultData.rosterSnapshots,
            gameModeTokens: defaultData.gameModeTokens,
        };
    }

    return {
        ...v1Data,
        leTeams: migrateLreTeams(v1Data.leTeams ?? defaultData.leTeams),
        inventory: {
            ...defaultData.inventory,
            ...v1Data.inventory,
        },
        gameModeTokens: {
            ...defaultData.gameModeTokens,
            ...v1Data.gameModeTokens,
        },
    };
};

function migrateLreTeams(
    teamsByEvent: LegendaryEventData<ILegendaryEventSelectedTeams>
): LegendaryEventData<ILegendaryEventSelectedTeams> {
    for (const teamsByEventKey in teamsByEvent) {
        const eventTeams = teamsByEvent[teamsByEventKey as unknown as LegendaryEventEnum];
        if (!eventTeams) {
            continue;
        }

        if (!eventTeams.teams?.length) {
            populateTeams(eventTeams);
        }

        if (eventTeams.teams?.length) {
            eventTeams.teams = eventTeams.teams.map(team => {
                const charSnowprintIds = (
                    team.charSnowprintIds?.length
                        ? team.charSnowprintIds
                        : team.charactersIds?.length
                          ? team.charactersIds
                          : (team.characters?.map(character => character.snowprintId) ?? [])
                ).map(id => resolve(id));
                const cleanedTeam: ILreTeam = {
                    ...team,
                    charSnowprintIds,
                    charactersIds: [],
                };

                delete cleanedTeam.characters;
                return cleanedTeam;
            });
        }
    }

    return teamsByEvent;
}

const resolve = (char: string) => CharactersService.canonicalName(char);
// Helper function to compare two arrays for equality
function areArraysEqual(array1: string[], array2: string[]): boolean {
    return array1.length === array2.length && array1.every(char => array2.includes(char));
}

function doTeamsMatch(team1: string[], team2: string[]) {
    return areArraysEqual(
        team1.map(id => CharactersService.canonicalName(id)),
        team2.map(id => CharactersService.canonicalName(id))
    );
}

function populateTeams(data: ILegendaryEventSelectedTeams) {
    const sections: LreTrackId[] = ['alpha', 'beta', 'gamma'];
    const teams: ILreTeam[] = [];

    for (const section of sections) {
        const selectedTeams: SelectedTeams = data[section];

        for (const [restriction, charSnowprintIds] of Object.entries(selectedTeams)) {
            // Check if there's already a team with the same set of characters
            const existingTeam = teams.find(
                team =>
                    doTeamsMatch(
                        (team.charSnowprintIds ?? team.charactersIds ?? []).map(x => resolve(x)),
                        charSnowprintIds.map(x => resolve(x))
                    ) && team.section === section
            );

            if (existingTeam) {
                // If found, combine the restriction with the existing team's restrictions
                delete existingTeam.characters; // Remove characters field if it exists
                if (!existingTeam.restrictionsIds.includes(restriction)) {
                    existingTeam.restrictionsIds.push(restriction);
                }
            } else if (charSnowprintIds?.length) {
                // If not found, create a new team
                const team: ILreTeam = {
                    id: v4(), // Replace with your UUID generation logic
                    name: `Team ${teams.length + 1} - ${section}`, // Assigning Team 1, 2, 3, etc.
                    section: section as LreTrackId,
                    restrictionsIds: [restriction], // Initial restriction,
                    charSnowprintIds: charSnowprintIds.map(x => CharactersService.canonicalName(x)), // Characters associated with this team
                };
                teams.push(team);
            }
        }
    }

    data.teams = teams; // Populate the teams field
}

function migrateLreProgress(progressByEvent: LegendaryEventData<ILreProgressDto>): LegendaryEventData<ILreProgressDto> {
    for (const progressByEventKey in progressByEvent) {
        const eventProgress = progressByEvent[progressByEventKey as unknown as LegendaryEventEnum];
        if (!eventProgress) {
            continue;
        }

        if (!eventProgress.battlesProgress?.length && !eventProgress.compactProgress) {
            populateProgress(eventProgress);
        }

        if (!eventProgress.compactProgress && eventProgress.battlesProgress?.length) {
            eventProgress.compactProgress = battlesProgressToCompact(eventProgress.battlesProgress);
            eventProgress.battlesProgress = undefined;
        }
    }
    return progressByEvent;
}

function populateProgress(data: ILreProgressDto) {
    const sections: LreTrackId[] = ['alpha', 'beta', 'gamma'];
    const battlesProgress: ILreBattleProgressDto[] = [];
    const lre = getLre(data.id, []);
    const killPointsIndex = 0;
    const highScoreAndDefeatAllIndex = 1;

    for (const section of sections) {
        const { battles } = data[section] ?? { battles: [] };
        for (const [index, battle] of battles.entries()) {
            const requirements: ILreRequirementsProgressDto[] = lre[section].unitsRestrictions.map(
                (restriction, restrictionIndex) => ({
                    id: restriction.name,
                    state: +battle[restrictionIndex + 2],
                })
            );

            requirements.push(
                {
                    id: LrePointsCategoryId.killScore,
                    state: +battle[killPointsIndex],
                },
                {
                    id: LrePointsCategoryId.defeatAll,
                    state: +battle[highScoreAndDefeatAllIndex],
                },
                {
                    id: LrePointsCategoryId.highScore,
                    state: +battle[highScoreAndDefeatAllIndex],
                }
            );

            battlesProgress.push({
                trackId: section,
                battleIndex: index,
                requirements: requirements,
            });
        }
    }

    data.battlesProgress = battlesProgress; // Populate the teams field
}

const isV1Data = (data: IPersonalData | IPersonalData2): data is IPersonalData => {
    const versionKey: keyof IPersonalData2 = 'schemaVersion';
    return !Object.hasOwn(data, versionKey);
};
