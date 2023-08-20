import { ILegendaryEventsData, IPersonalData, IViewPreferences } from './personal-data.interfaces';
import { useState } from 'react';

export class PersonalDataService {
    static personalDataStorageKey = 'personalData';
    static data: IPersonalData;
    
    static init(): void {
        
        const storedData = localStorage.getItem(this.personalDataStorageKey);
        const defaultViewPreferences: IViewPreferences = { 
            onlyUnlocked: false,
            usedInCampaigns: false
        };
        const defaultLegendaryEventsData: ILegendaryEventsData = {
            jainZar: {
                selectedTeams: [{}, {}, {}, {}, {}]
            },
            aunShi: {
                selectedTeams: [{}, {}, {}, {}, {}]
            }
        };
        
        if(storedData) {
            this.data = JSON.parse(storedData);
            this.data.characters ??= [];
            this.data.viewPreferences ??= defaultViewPreferences;
            this.data.legendaryEvents ??= defaultLegendaryEventsData;
            this.data.legendaryEvents.jainZar ??= defaultLegendaryEventsData.jainZar;
            this.data.legendaryEvents.aunShi ??= defaultLegendaryEventsData.aunShi;
        }
        
        this.data ??=  { 
            characters: [], 
            viewPreferences: defaultViewPreferences, 
            legendaryEvents: defaultLegendaryEventsData 
        };
    }
    
    static save():void {
        const storeData = JSON.stringify(this.data);
        localStorage.setItem(this.personalDataStorageKey, storeData);
    }
}