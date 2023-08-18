import { IPersonalData, IViewPreferences } from './personal-data.interfaces';

export class PersonalDataService {
    static personalDataStorageKey = 'personalData';
    static data: IPersonalData;
    
    static init(): void {
        const storedData = localStorage.getItem(this.personalDataStorageKey);
        const defaultViewPreferences: IViewPreferences = { fitToScreen: true, onlyUnlocked: true };
        if(storedData) {
            this.data = JSON.parse(storedData);
            this.data.characters ??= [];
            this.data.viewPreferences ??= defaultViewPreferences;
        }
        
        this.data ??=  { characters: [], viewPreferences: defaultViewPreferences };
    }
    
    static save():void {
        const storeData = JSON.stringify(this.data);
        localStorage.setItem(this.personalDataStorageKey, storeData);
    }
}