import { FactionId } from '@/fsd/5-shared/model';

import { ICampaignBattleComposed } from '@/fsd/4-entities/campaign';
import { UpgradesService } from '@/fsd/4-entities/upgrade';

export class StaticDataService {
    static getItemLocations = (itemId: string): ICampaignBattleComposed[] => {
        const possibleLocations: ICampaignBattleComposed[] = [];
        const recipeData = UpgradesService.recipeDataFull[itemId];
        if (recipeData) {
            const fullData = recipeData.allMaterials && recipeData.allMaterials[0];
            if (fullData) {
                possibleLocations.push(...(fullData.locationsComposed ?? []));
            }
        }

        return possibleLocations;
    };

    static getFactionPray(faction: FactionId): string {
        switch (faction) {
            case 'Ultramarines':
            case 'Sisterhood':
            case 'AstraMilitarum':
            case 'BlackTemplars':
            case 'SpaceWolves':
            case 'DarkAngels':
                return 'Pray for the God-Emperor of Mankind';
            case 'AdeptusMechanicus':
                return 'Pray for the Machine God';
            case 'BlackLegion':
                return 'Follow the Chaos Undivided';
            case 'Orks':
                return 'Believe in the Waaagh!';
            case 'Necrons':
                return "Serve the C'tan";
            case 'DeathGuard':
                return 'Pray for the Plague God';
            case 'Aeldari':
                return 'Follow various Paths';
            case 'Tau':
                return 'Pray for Greater Good';
            case 'ThousandSons':
                return 'Follow the Architect of Fate';
            case 'Tyranids':
                return 'Bring more biomass';
            case 'WorldEaters':
                return 'More Blood for the Blood God!';
            case 'Genestealers':
            case 'BloodAngels':
            case 'Custodes':
            case 'EmperorsChildren':
            case 'LeaguesOfVotann':
                return '';
        }
    }
}
