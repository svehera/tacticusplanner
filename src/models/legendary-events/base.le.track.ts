import {
    IAutoTeamsPreferences,
    ICharacter,
    ILegendaryEventTrack,
    ILegendaryEventTrackRestriction,
    LegendaryEventSection
} from '../interfaces';
import { orderBy, sortBy, sum } from 'lodash';
import { LegendaryEvents } from '../enums';

export class LETrack implements ILegendaryEventTrack {

    public section: LegendaryEventSection;

    constructor(
        public name: string,
        public killPoints: number,
        public allowedUnits: ICharacter[],
        public unitsRestrictions: Array<ILegendaryEventTrackRestriction>
    ) {
        this.section = name.includes('Alpha') ? '(Alpha)' : name.includes('Beta') ? '(Beta)' : '(Gamma)';
    }

    getCharacterPoints(character: ICharacter): number {
        const isAllowedUnit = this.allowedUnits.some(u => u.name === character.name);
        if (!isAllowedUnit) {
            return 0;
        }

        return this.killPoints + sum(this.unitsRestrictions
            .filter(x => x.units.some(u => u.name === character.name))
            .map(x => x.points));
    }

    getCharacterSlots(character: ICharacter): number {
        const isAllowedUnit = this.allowedUnits.some(u => u.name === character.name);
        if (!isAllowedUnit) {
            return 0;
        }

        return this.unitsRestrictions
            .filter(x => x.units.some(u => u.name === character.name)).length;
    }

    getRestrictionPoints(name: string): number {
        return this.unitsRestrictions.find(x => x.name === name)?.points ?? 0;
    }

    suggestTeams(event: LegendaryEvents, settings: IAutoTeamsPreferences): Array<ICharacter[]> {
        return this.unitsRestrictions.map(x => {
            const units = x.units
                .filter(x => x.unlocked)
                .map(unit => ({
                    name: unit.name,
                    rank: +unit.rank,
                    rarity: +unit.rarity,
                    requiredInCampaign: unit.requiredInCampaign,
                    points: unit.legendaryEvents[event].points,
                    alwaysRecommend: unit.alwaysRecommend ?? false,
                    neverRecommend: unit.neverRecommend ?? false, 
                }));
            const iterates: string[] = [];
            const orders: Array<'asc' | 'desc'> = [];
            
            if (!settings.ignoreRecommendedFirst) {
                iterates.push('alwaysRecommend');
                orders.push('desc');
            }
            
            if (!settings.ignoreRecommendedLast) {
                iterates.push('neverRecommend');
                orders.push('asc');
            }
            
            if (settings.preferCampaign) {
                iterates.push('requiredInCampaign');
                orders.push('desc');
            }

            if (!settings.ignoreRarity) {
                iterates.push('rarity');
                orders.push('desc');
            }

            if (!settings.ignoreRank) {
                iterates.push('rank');
                orders.push('desc');
            }
            
            iterates.push('points');
            orders.push('desc');

            const top5 = orderBy(units, iterates, orders).slice(0, 5).map(unit => unit.name);
            return sortBy(x.units.filter(unit => top5.includes(unit.name)), 'name');
        });
    }


}