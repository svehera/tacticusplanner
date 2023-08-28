import { ICharacter } from './static-data/interfaces';
import { IPersonalCharacterData, LegendaryEvents, Rank } from './personal-data/personal-data.interfaces';
import { PersonalDataService } from './personal-data/personal-data.service';
import { StaticDataUtils } from './static-data/static-data.utils';


export default class GlobalStoreService {

    static characters: Array<ICharacter>;

    static init(): void {
        PersonalDataService.init();
        const staticUnitData = StaticDataUtils.unitsData;
        const personalUnitData = PersonalDataService.data;

        this.characters = staticUnitData.map(staticData => {
            const personalData: IPersonalCharacterData = personalUnitData.characters.find(c => c.name === staticData.name)
                ?? {
                    name: '',
                    rank: Rank.Undefined,
                    leSelection: LegendaryEvents.None,
                    alwaysRecommend: false,
                    neverRecommend: false
                };
            return {
                ...personalData, ...staticData,
                rank: +(personalData.rank ?? Rank.Undefined),
                alwaysRecommend: personalData.alwaysRecommend ?? false,
                neverRecommend: personalData.neverRecommend ?? false
            };
        });
    }
}