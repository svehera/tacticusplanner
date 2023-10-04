import {
    IAutoTeamsPreferences,
    ICharacter,
    ILegendaryEventTrack,
    ILegendaryEventTrackRequirement,
    LegendaryEventSection
} from '../interfaces';
import { intersectionBy, orderBy, sum } from 'lodash';
import { LegendaryEvent } from '../enums';

export class LETrack implements ILegendaryEventTrack {


    constructor(
        public eventId: LegendaryEvent,
        public section: LegendaryEventSection,
        public name: string,
        public killPoints: number,
        public allowedUnits: ICharacter[],
        public unitsRestrictions: Array<ILegendaryEventTrackRequirement>
    ) {
        this.unitsRestrictions = orderBy(unitsRestrictions, 'points');
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

    suggestTeams(settings: IAutoTeamsPreferences, restrictions: string[]): Record<string, ICharacter[]> {
        const coreSuggestedTeams = this.suggestTeam(settings, restrictions);
        const result: Record<string, ICharacter[]> = {};
        
        this.unitsRestrictions.forEach(x => {
            result[x.name] = restrictions.includes(x.name) ? [...coreSuggestedTeams] : this.suggestTeam(settings, [x.name]);
        });
        
        return result;
    }

    suggestTeam(settings: IAutoTeamsPreferences, restrictions: string[]): Array<ICharacter> {
        let allowedChars: ICharacter[] = [];
        if(!restrictions.length) {
            allowedChars = this.allowedUnits;
        } else {

            allowedChars = intersectionBy(...this.unitsRestrictions
                .filter(x => restrictions.includes(x.name))
                .map(x => x.units), 'name');
        }
        
        const sortChars = allowedChars
            .filter(x => settings.onlyUnlocked ? x.unlocked : true)
            .map(unit => ({
                name: unit.name,
                rank: +unit.rank,
                rarity: +unit.rarity,
                requiredInCampaign: unit.requiredInCampaign,
                points: unit.legendaryEvents[this.eventId].totalPoints,
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

        return orderBy(sortChars, iterates, orders).map(unit => allowedChars.find(x => x.name === unit.name) ?? {} as ICharacter);
    }


}