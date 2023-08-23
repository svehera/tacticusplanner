import {
    ICharacter,
    ILegendaryEventTrack,
    ILegendaryEventTrackRestriction,
    LegendaryEventSection
} from '../static-data/interfaces';
import { sum } from 'lodash';

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

    getCharacterPoints (character: ICharacter): number {
        const isAllowedUnit = this.allowedUnits.some(u => u.name === character.name);
        if (!isAllowedUnit) {
            return 0;
        }
        
        return this.killPoints + sum(this.unitsRestrictions
            .filter(x => x.units.some(u => u.name === character.name))
            .map(x => x.points));
    }
    
    getRestrictionPoints (name: string): number {
        return this.unitsRestrictions.find(x => x.name === name)?.points ?? 0;
    }

}