import {
    IAutoTeamsPreferences,
    ILegendaryEventProgressState,
    ILegendaryEventSelectedRequirements,
    ILegendaryEventSelectedTeams,
    IPersonalCharacterData2,
    IPersonalData,
    IPersonalData2,
    IPersonalGoal,
    ISelectedTeamsOrdering,
    IViewPreferences,
    LegendaryEventData,
} from '../models/interfaces';
import { defaultData } from '../models/constants';
import { Rank } from '../models/enums';

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
                viewPreferences: {
                    ...defaultData.viewPreferences,
                    ...(this.getItem<IViewPreferences>('viewPreferences') ?? {}),
                },
                characters: this.getItem<IPersonalCharacterData2[]>('characters') ?? defaultData.characters,
                goals: this.getItem<IPersonalGoal[]>('goals') ?? defaultData.goals,
                selectedTeamOrder:
                    this.getItem<ISelectedTeamsOrdering>('selectedTeamOrder') ?? defaultData.selectedTeamOrder,
                leTeams:
                    this.getItem<LegendaryEventData<ILegendaryEventSelectedTeams>>('leTeams') ?? defaultData.leTeams,
                leProgress:
                    this.getItem<LegendaryEventData<ILegendaryEventProgressState>>('leProgress') ??
                    defaultData.leProgress,
                leSelectedRequirements:
                    this.getItem<LegendaryEventData<ILegendaryEventSelectedRequirements>>('leSelectedRequirements') ??
                    defaultData.leSelectedRequirements,
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
                this.setItem(storeKey, value);
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
        };
    }

    return v1Data;
};

export const isV1Data = (data: IPersonalData | IPersonalData2): data is IPersonalData => {
    const versionKey: keyof IPersonalData2 = 'schemaVersion';
    return !Object.hasOwn(data, versionKey);
};
