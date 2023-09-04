import {
    ICharacter,
    IPersonalCharacter,
    IPersonalCharacterData,
} from '../models/interfaces';
import { PersonalDataService } from './personal-data.service';
import { StaticDataService } from './static-data.service';
import { LegendaryEvents, Rank } from '../models/enums';

export class GlobalService {
    static characters: Array<ICharacter>;

    static init(): void {
        PersonalDataService.init();
        const staticUnitData = StaticDataService.unitsData;
        const personalUnitData = PersonalDataService.data;

        this.characters = staticUnitData.map((staticData) => {
            const personalData: IPersonalCharacter = personalUnitData.characters.find(
                (c) => c.name === staticData.name
            ) ?? {
                name: staticData.name,
                unlocked: false,
                progress: false,
                rank: Rank.Stone1,
                rarity: staticData.rarity,
                rarityStars: staticData.rarityStars,
                leSelection: LegendaryEvents.None,
                alwaysRecommend: false,
                neverRecommend: false,
                currentShards: 0,
                targetRarity: staticData.rarity,
                targetRarityStars: staticData.rarityStars,
            };
            return {
                ...staticData,
                ...personalData,
                rank: +personalData.rank,
            };
        });
    }
}
