import {
    ILegendaryEventsData,
    IPersonalData,
} from '../models/interfaces';
import { defaultAutoTeamsPreferences, defaultViewPreferences } from '../contexts';

export class PersonalDataService {
    static personalDataStorageKey = 'personalData';
    static data: IPersonalData;

    static init(): void {

        const storedData = localStorage.getItem(this.personalDataStorageKey);

        const defaultLegendaryEventsData: ILegendaryEventsData = {
            jainZar: {
                selectedTeams: [{}, {}, {}, {}, {}]
            },
            aunShi: {
                selectedTeams: [{}, {}, {}, {}, {}]
            },
            shadowSun: {
                selectedTeams: [{}, {}, {}, {}, {}]
            }
        };

        if (storedData) {
            this.data = JSON.parse(storedData);
            this.data.characters ??= [];

            this.data.viewPreferences ??= defaultViewPreferences;
            this.data.viewPreferences.showAlpha = true;
            this.data.viewPreferences.showBeta = true;
            this.data.viewPreferences.showGamma = true;

            this.data.autoTeamsPreferences ??= defaultAutoTeamsPreferences;
            this.data.legendaryEvents ??= defaultLegendaryEventsData;

            this.data.legendaryEvents.jainZar ??= defaultLegendaryEventsData.jainZar;
            this.data.legendaryEvents.aunShi ??= defaultLegendaryEventsData.aunShi;
            this.data.legendaryEvents.shadowSun ??= defaultLegendaryEventsData.shadowSun;
        }

        this.data ??= {
            characters: [],
            viewPreferences: defaultViewPreferences,
            autoTeamsPreferences: defaultAutoTeamsPreferences,
            legendaryEvents: defaultLegendaryEventsData
        };
    }

    static save(): void {
        const storeData = JSON.stringify(this.data);
        localStorage.setItem(this.personalDataStorageKey, storeData);
    }
}