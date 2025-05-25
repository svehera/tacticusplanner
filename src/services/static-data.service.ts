import { Faction } from '@/fsd/5-shared/model';

import { ICampaignBattleComposed } from '@/fsd/4-entities/campaign';
import { UpgradesService } from '@/fsd/4-entities/upgrade';

export class StaticDataService {
    static getItemLocations = (itemId: string): ICampaignBattleComposed[] => {
        const possibleLocations: ICampaignBattleComposed[] = [];
        const characterShardsData = UpgradesService.recipeDataFull[itemId];
        if (characterShardsData) {
            const fullData = characterShardsData.allMaterials && characterShardsData.allMaterials[0];
            if (fullData) {
                possibleLocations.push(...(fullData.locationsComposed ?? []));
            }
        }

        return possibleLocations;
    };

    static getFactionPray(faction: Faction): string {
        switch (faction) {
            case Faction.Ultramarines:
            case Faction.ADEPTA_SORORITAS:
            case Faction.Astra_militarum:
            case Faction.Black_Templars:
            case Faction.Space_Wolves:
            case Faction.Dark_Angels:
                return 'Pray for the God-Emperor of Mankind';
            case Faction.AdeptusMechanicus:
                return 'Pray for the Machine God';
            case Faction.Black_Legion:
                return 'Follow the Chaos Undivided';
            case Faction.Orks:
                return 'Believe in the Waaagh!';
            case Faction.Necrons:
                return "Serve the C'tan";
            case Faction.Death_Guard:
                return 'Pray for the Plague God';
            case Faction.Aeldari:
                return 'Follow various Paths';
            case Faction.T_Au:
                return 'Pray for Greater Good';
            case Faction.Thousand_Sons:
                return 'Follow the Architect of Fate';
            case Faction.Tyranids:
                return 'Bring more biomass';
            case Faction.WorldEaters:
                return 'More Blood for the Blood God!';
            default:
                return '';
        }
    }
}
