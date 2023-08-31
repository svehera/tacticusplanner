import { ICharacter, IPersonalCharacterData } from '../models/interfaces';
import { PersonalDataService } from './personal-data.service';
import { StaticDataService } from './static-data.service';
import { LegendaryEvents, Rank } from '../models/enums';

export class GlobalService {

    static characters: Array<ICharacter>;

    static init(): void {
        PersonalDataService.init();
        const staticUnitData = StaticDataService.unitsData;
        const personalUnitData = PersonalDataService.data;

        this.characters = staticUnitData.map(staticData => {
            const personalData: IPersonalCharacterData = personalUnitData.characters.find(c => c.name === staticData.name)
                ?? {
                    name: '',
                    rank: Rank.Stone1,
                    leSelection: LegendaryEvents.None,
                    alwaysRecommend: false,
                    neverRecommend: false
                };
            return {
                ...personalData, ...staticData,
                rank: +(personalData.rank || Rank.Stone1),
                rarity: personalData.rarity ?? staticData.rarity,
                alwaysRecommend: personalData.alwaysRecommend ?? false,
                neverRecommend: personalData.neverRecommend ?? false
            };
        });
    }
}