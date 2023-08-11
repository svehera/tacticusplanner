import { LegendaryEvent, LegendaryEventTrack } from '../interfaces';
import { Alliance, DamageTypes, Faction } from '../enums';

export class JainZarLegendaryEvent implements LegendaryEvent {
    alphaTrack: LegendaryEventTrack = this.getAlphaTrack();
    betaTrack: LegendaryEventTrack = this.getAlphaTrack();
    gammaTrack: LegendaryEventTrack = this.getAlphaTrack();


    private getAlphaTrack(): LegendaryEventTrack {

        return {
            factionRestriction: (unit) => unit.alliance === Alliance.Xenos,
            unitsRestrictions: [
                {
                    name: 'Physical',
                    points: 100,
                    restriction: (unit) => (unit.damageTypes & DamageTypes.Physical) === DamageTypes.Physical,
                },
                {
                    name: 'Ranged',
                    points: 100,
                    restriction: (unit) => !!unit.rangeHits,
                },
                {
                    name: 'Max 3 hits',
                    points: 100,
                    restriction: (unit) => unit.meleeHits <= 3 && (!unit.rangeHits || unit.rangeHits <= 3),
                },
                {
                    name: 'Necrons only',
                    points: 100,
                    restriction: (unit) =>  unit.faction === Faction.Necrons,
                },
            ]
        };
    }

}