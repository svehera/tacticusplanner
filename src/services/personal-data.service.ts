import { v4 } from 'uuid';

import { Rank } from '@/fsd/5-shared/model';

import { CharactersService } from '@/fsd/4-entities/character';
import { LegendaryEventEnum, LreTrackId } from '@/fsd/4-entities/lre';

import { IMowDb } from '@/fsd/3-features/characters/characters.models';
import { getLre } from '@/fsd/3-features/lre';
import {
    ILreProgressDto,
    ILreBattleProgressDto,
    ILreRequirementsProgressDto,
    LrePointsCategoryId,
} from '@/fsd/3-features/lre-progress';
import { IPersonalTeam } from '@/fsd/3-features/teams/teams.models';

import { XpUseState } from '@/fsd/1-pages/input-resources/models';
import { IRosterSnapshotsState } from '@/fsd/1-pages/input-roster-snapshots/models';
import { XpIncomeState } from '@/fsd/1-pages/input-xp-income/models';

import { defaultData } from '../models/constants';
import {
    IAutoTeamsPreferences,
    ICampaignsProgress,
    IDailyRaids,
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
                    ...(this.getItem<IAutoTeamsPreferences>('autoTeamsPreferences') ?? {}),
                },
                dailyRaidsPreferences: {
                    ...defaultData.dailyRaidsPreferences,
                    ...(this.getItem<IDailyRaidsPreferences>('dailyRaidsPreferences') ?? {}),
                },
                viewPreferences: {
                    ...defaultData.viewPreferences,
                    ...(this.getItem<IViewPreferences>('viewPreferences') ?? {}),
                },
                characters: this.getItem<IPersonalCharacterData2[]>('characters') ?? defaultData.characters,
                mows: this.getItem<IMowDb[]>('mows') ?? defaultData.mows,
                teams: this.getItem<IPersonalTeam[]>('teams') ?? defaultData.teams,
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
                campaignsProgress: {
                    ...defaultData.campaignsProgress,
                    ...(this.getItem<ICampaignsProgress>('campaignsProgress') ?? {}),
                },
                inventory: {
                    ...defaultData.inventory,
                    ...(this.getItem<IInventory>('inventory') ?? {}),
                },
                dailyRaids: {
                    ...defaultData.dailyRaids,
                    ...(this.getItem<IDailyRaids>('dailyRaids') ?? {}),
                },
                guildWar: {
                    ...defaultData.guildWar,
                    ...(this.getItem<IGuildWar>('guildWar') ?? {}),
                },
                guild: {
                    ...defaultData.guild,
                    ...(this.getItem<IGuild>('guild') ?? {}),
                },
                xpIncome: {
                    ...defaultData.xpIncome,
                    ...(this.getItem<XpIncomeState>('xpIncome') ?? {}),
                },
                xpUse: {
                    ...defaultData.xpUse,
                    ...(this.getItem<XpUseState>('xpUse') ?? {}),
                },
                rosterSnapshots: {
                    ...defaultData.rosterSnapshots,
                    ...(this.getItem<IRosterSnapshotsState>('rosterSnapshots') ?? defaultData.rosterSnapshots),
                },
            };
        } else {
            // no version (convert v1 to v2)
            const v1StoredData = localStorage.getItem(this.v1personalDataStorageKey);
            if (!v1StoredData) {
                result = defaultData;
            } else {
                try {
                    const v1Data: IPersonalData | IPersonalData2 = JSON.parse(v1StoredData);
                    result = convertData(v1Data);
                } catch {
                    result = defaultData;
                }
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

    restoreData(): IPersonalData2 | null {
        const backup = localStorage.getItem(this.backupKey);
        if (!backup) {
            return null;
        } else {
            try {
                const data: IPersonalData | IPersonalData2 = JSON.parse(backup);
                return convertData(data);
            } catch {
                return null;
            }
        }
    }

    public storeBackup(data: IPersonalData2): void {
        const serialized = JSON.stringify(data);
        localStorage.setItem(this.backupKey, serialized);
        localStorage.setItem(this.backUpDateKey, new Date().toISOString());
    }

    public getBackupDate(): Date | null {
        const date = localStorage.getItem(this.backUpDateKey);
        if (!date) {
            return null;
        }

        return new Date(date);
    }

    private getItem<T>(key: keyof IPersonalData2): T | null {
        const value = localStorage.getItem(this.storePrefix + key);

        if (!value) {
            return null;
        }

        try {
            return JSON.parse(value);
        } catch {
            return null;
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
                ...(v1Data.autoTeamsPreferences ?? {}),
            },
            viewPreferences: {
                ...defaultData.viewPreferences,
                ...(v1Data.viewPreferences ?? {}),
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
            leTeams: v1Data.legendaryEvents3 ?? defaultData.leTeams,
            leProgress: v1Data.legendaryEventsProgress ?? defaultData.leProgress,
            leSelectedRequirements: v1Data.legendaryEventSelectedRequirements ?? defaultData.leSelectedRequirements,
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
            rosterSnapshots: defaultData.rosterSnapshots,
        };
    }

    return {
        ...v1Data,
        inventory: {
            ...defaultData.inventory,
            ...v1Data.inventory,
        },
    };
};

function migrateLreTeams(
    teamsByEvent: LegendaryEventData<ILegendaryEventSelectedTeams>
): LegendaryEventData<ILegendaryEventSelectedTeams> {
    for (const teamsByEventKey in teamsByEvent) {
        const eventTeams = teamsByEvent[teamsByEventKey as unknown as LegendaryEventEnum];
        if (eventTeams && !eventTeams.teams?.length) {
            populateTeams(eventTeams);
        }
    }

    return teamsByEvent;
}

function populateTeams(data: ILegendaryEventSelectedTeams) {
    const sections: LreTrackId[] = ['alpha', 'beta', 'gamma'];
    const teams: ILreTeam[] = [];

    // Helper function to compare two arrays for equality
    function areArraysEqual(arr1: string[], arr2: string[]): boolean {
        return arr1.length === arr2.length && arr1.every(char => arr2.includes(char));
    }

    function doTeamsMatch(team1: string[], team2: string[]) {
        return areArraysEqual(
            team1.map(id => CharactersService.canonicalName(id)),
            team2.map(id => CharactersService.canonicalName(id))
        );
    }

    sections.forEach(section => {
        const selectedTeams: SelectedTeams = data[section];

        Object.entries(selectedTeams).forEach(([restriction, charSnowprintIds]) => {
            const resolve = (char: string) => CharactersService.canonicalName(char);
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
        });
    });

    data.teams = teams; // Populate the teams field
}

function migrateLreProgress(progressByEvent: LegendaryEventData<ILreProgressDto>): LegendaryEventData<ILreProgressDto> {
    for (const progressByEventKey in progressByEvent) {
        const eventProgress = progressByEvent[progressByEventKey as unknown as LegendaryEventEnum];
        if (eventProgress && !eventProgress.battlesProgress?.length) {
            populateProgress(eventProgress);
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

    sections.forEach(section => {
        const { battles } = data[section] ?? { battles: [] };
        battles.forEach((battle, index) => {
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
        });
    });

    data.battlesProgress = battlesProgress; // Populate the teams field
}

const isV1Data = (data: IPersonalData | IPersonalData2): data is IPersonalData => {
    const versionKey: keyof IPersonalData2 = 'schemaVersion';
    return !Object.hasOwn(data, versionKey);
};
