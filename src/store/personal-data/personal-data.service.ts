import { IPersonalData } from './personal-data.interfaces';

export class PersonalDataService {
    static personalDataStorageKey = 'personalData';
    static data: IPersonalData;
    
    static init(): void {
        const storedData = localStorage.getItem(this.personalDataStorageKey);
        this.data = storedData ?  JSON.parse(storedData) : { characters: [] };
    }
    
    static save():void {
        const storeData = JSON.stringify(this.data);
        localStorage.setItem(this.personalDataStorageKey, storeData);
    }
}