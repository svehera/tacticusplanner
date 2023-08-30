import {
    IAutoTeamsPreferences,
    ILegendaryEventsData,
    IPersonalData,
    IViewPreferences
} from '../models/interfaces';

export class PersonalDataService {
    static personalDataStorageKey = 'personalData';
    static data: IPersonalData;
    
    static init(): void {
        
        const storedData = localStorage.getItem(this.personalDataStorageKey);
        const defaultViewPreferences: IViewPreferences = { 
            onlyUnlocked: false,
            usedInCampaigns: false
        };
        const defaultAutoTeamsPreferences: IAutoTeamsPreferences = {
            preferCampaign: false,
            ignoreRank: false,
            ignoreRecommended: false
        };
        
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
        
        if(storedData) {
            this.data = JSON.parse(storedData);
            this.data.characters ??= [];
            
            this.data.viewPreferences ??= defaultViewPreferences;
            this.data.autoTeamsPreferences ??= defaultAutoTeamsPreferences;
            this.data.legendaryEvents ??= defaultLegendaryEventsData;
            
            this.data.legendaryEvents.jainZar ??= defaultLegendaryEventsData.jainZar;
            this.data.legendaryEvents.aunShi ??= defaultLegendaryEventsData.aunShi;
            this.data.legendaryEvents.shadowSun ??= defaultLegendaryEventsData.shadowSun;
        }
        
        this.data ??=  { 
            characters: [], 
            viewPreferences: defaultViewPreferences, 
            autoTeamsPreferences: defaultAutoTeamsPreferences,
            legendaryEvents: defaultLegendaryEventsData 
        };
    }
    
    static save():void {
        const storeData = JSON.stringify(this.data);
        localStorage.setItem(this.personalDataStorageKey, storeData);
    }
}