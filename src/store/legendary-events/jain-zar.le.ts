import { ICharacter, ILegendaryEventTrack, ITableRow } from '../static-data/interfaces';
import { Alliance, DamageTypes, Faction, Traits } from '../static-data/enums';
import { LegendaryEvents } from '../personal-data/personal-data.interfaces';
import { filter } from './filters';
import { LegendaryEventBase } from './base.le';
import { LETrack } from './base.le.track';

export class JainZarLegendaryEvent extends LegendaryEventBase {
    constructor(unitsData: Array<ICharacter>, selectedTeams: ITableRow[]) {
        super(LegendaryEvents.JainZar, unitsData, selectedTeams);
    }

    protected getAlphaTrack(unitsData: Array<ICharacter>): ILegendaryEventTrack {
        const xenosOnly = filter(unitsData).byAlliance(Alliance.Xenos);
        return new LETrack(
            'Alpha (Xenos only)',
            42,
            xenosOnly,
            [
                {
                    name: 'Physical',
                    points: 100,
                    units: filter(xenosOnly).byDamageType(DamageTypes.Physical),
                },
                {
                    name: 'Ranged',
                    points: 60,
                    units: filter(xenosOnly).byAttackType('rangeOnly'),
                },
                {
                    name: 'Max 3 hits',
                    points: 45,
                    units: filter(xenosOnly).byMaxHits(3),
                },
                {
                    name: 'Necrons only',
                    points: 110,
                    units: filter(xenosOnly).byFaction(Faction.Necrons),
                },
                {
                    name: 'No Summons',
                    points: 60,
                    units: filter(xenosOnly).byNoSummons(),
                },
            ]
        );
    }

    protected getBetaTrack(unitsData: Array<ICharacter>): ILegendaryEventTrack {
        const imperialOnly = filter(unitsData).byAlliance(Alliance.Imperial);
        return new LETrack(
            'Beta (Imperial only)',
            40,
            imperialOnly, 
            [
                {
                    name: 'Power',
                    points: 95,
                    units: filter(imperialOnly).byDamageType(DamageTypes.Power),
                },
                {
                    name: 'Bolter',
                    points: 95,
                    units: filter(imperialOnly).byDamageType(DamageTypes.Bolter),
                },
                {
                    name: 'No Blast',
                    points: 50,
                    units: filter(imperialOnly).byDamageType(DamageTypes.Blast, true),
                },
                {
                    name: 'Max 2 hits',
                    points: 70,
                    units: filter(imperialOnly).byMaxHits(2),
                },
                {
                    name: 'No Summons',
                    points: 60,
                    units: filter(imperialOnly).byNoSummons(),
                },
            ]
        );
    }

    protected getGammaTrack(unitsData: Array<ICharacter>): ILegendaryEventTrack {
        const noOrks = filter(unitsData).byFaction(Faction.Orks, true);
        return new LETrack(
            'Gamma (No Orks)',
            29,
            noOrks,
            [
                {
                    name: 'No Mech',
                    points: 45,
                    units: filter(noOrks).isNotMechanical(),
                },
                {
                    name: 'Piercing',
                    points: 100,
                    units: filter(noOrks).byDamageType(DamageTypes.Piercing),
                },
                {
                    name: 'Bolter',
                    points: 95,
                    units: filter(noOrks).byDamageType(DamageTypes.Bolter),
                },
                {
                    name: 'No Flying',
                    points: 45,
                    units: filter(noOrks).byTrait(Traits.Flying, true),
                },
                {
                    name: 'Min 4 hits',
                    points: 90,
                    units: filter(noOrks).byMinHits(4),
                },
            ]
        );
    }

}