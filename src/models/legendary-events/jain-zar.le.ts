import { ICharacter, ILegendaryEventTrack, ITableRow } from '../interfaces';
import { Alliance, DamageType, Faction, Trait, LegendaryEvent } from '../enums';
import { filter } from './filters';
import { LegendaryEventBase } from './base.le';
import { LETrack } from './base.le.track';

export class JainZarLegendaryEvent extends LegendaryEventBase {
    constructor(unitsData: Array<ICharacter>) {
        super(LegendaryEvent.JainZar, 'Jain Zar', unitsData);
    }

    protected getAlphaTrack(unitsData: Array<ICharacter>): ILegendaryEventTrack {
        const xenosOnly = filter(unitsData).byAlliance(Alliance.Xenos);
        return new LETrack(
            this.id,
            'alpha',
            'Alpha (Xenos only)',
            42,
            xenosOnly,
            [
                {
                    name: 'Physical',
                    points: 100,
                    units: filter(xenosOnly).byDamageType(DamageType.Physical),
                },
                {
                    name: 'Ranged',
                    points: 60,
                    units: filter(xenosOnly).byAttackType('rangeOnly'),
                    core: true,
                },
                {
                    name: 'Max 3 hits',
                    points: 45,
                    units: filter(xenosOnly).byMaxHits(3),
                    core: true,
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
                    core: true,
                },
            ]
        );
    }

    protected getBetaTrack(unitsData: Array<ICharacter>): ILegendaryEventTrack {
        const imperialOnly = filter(unitsData).byAlliance(Alliance.Imperial);
        return new LETrack(
            this.id,
            'beta',
            'Beta (Imperial only)',
            40,
            imperialOnly, 
            [
                {
                    name: 'Power',
                    points: 95,
                    units: filter(imperialOnly).byDamageType(DamageType.Power),
                },
                {
                    name: 'Bolter',
                    points: 95,
                    units: filter(imperialOnly).byDamageType(DamageType.Bolter),
                },
                {
                    name: 'No Blast',
                    points: 50,
                    units: filter(imperialOnly).byDamageType(DamageType.Blast, true),
                    core: true,
                },
                {
                    name: 'Max 2 hits',
                    points: 70,
                    units: filter(imperialOnly).byMaxHits(2),
                    core: true,
                },
                {
                    name: 'No Summons',
                    points: 60,
                    units: filter(imperialOnly).byNoSummons(),
                    core: true,
                },
            ]
        );
    }

    protected getGammaTrack(unitsData: Array<ICharacter>): ILegendaryEventTrack {
        const noOrks = filter(unitsData).byFaction(Faction.Orks, true);
        return new LETrack(
            this.id,
            'gamma',
            'Gamma (No Orks)',
            29,
            noOrks,
            [
                {
                    name: 'No Mech',
                    points: 45,
                    units: filter(noOrks).isNotMechanical(),
                    core: true,
                },
                {
                    name: 'Piercing',
                    points: 100,
                    units: filter(noOrks).byDamageType(DamageType.Piercing),
                },
                {
                    name: 'Bolter',
                    points: 95,
                    units: filter(noOrks).byDamageType(DamageType.Bolter),
                },
                {
                    name: 'No Flying',
                    points: 45,
                    units: filter(noOrks).byTrait(Trait.Flying, true),
                    core: true,
                },
                {
                    name: 'Min 4 hits',
                    points: 90,
                    units: filter(noOrks).byMinHits(4),
                    core: true,
                },
            ]
        );
    }

}