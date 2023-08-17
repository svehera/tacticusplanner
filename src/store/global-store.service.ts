import { IUnitData } from './static-data/interfaces';
import { PersonalCharacterData } from './personal-data/personal-data.interfaces';
import { PersonalDataService } from './personal-data/personal-data.service';
import { StaticDataUtils } from './static-data/static-data.utils';


export default class GlobalStoreService {

    static characters: Array<IUnitData & Partial<PersonalCharacterData>>;
    
    static init(): void {
        PersonalDataService.init();
        const staticUnitData = StaticDataUtils.unitsData;
        const personalUnitData = PersonalDataService.data;

        this.characters = staticUnitData.map(staticData => {
            const personalData = personalUnitData.characters.find(c => c.name === staticData.name);
            return personalData ? { ...staticData, ...personalData } : staticData;
        });
    }
}