import { ICharacter, ILegendaryEventTrack, ITableRow } from '../interfaces';
import { Alliance, DamageType, Faction, Trait,  LegendaryEvent } from '../enums';
import { filter } from './filters';
import { LegendaryEventBase } from './base.le';
import { LETrack } from './base.le.track';

export class ShadowSunLegendaryEvent extends LegendaryEventBase {

    constructor(unitsData: Array<ICharacter>, selectedTeams: ITableRow[]) {
        super(LegendaryEvent.ShadowSun, 'Shadowsun',  unitsData, selectedTeams);
    }

    protected getAlphaTrack(unitsData: Array<ICharacter>): ILegendaryEventTrack {
        const noNecrons = filter(unitsData).byFaction(Faction.Necrons, true);
        return new LETrack(
            this.id,
            'alpha',
            'Alpha (No Necrons)',
            18,
            noNecrons,
            [
                {
                    name: 'Big Target',
                    points: 115,
                    units: filter(noNecrons).byTrait(Trait.BigTarget),
                },
                {
                    name: 'No Psykers',
                    points: 40,
                    units: filter(noNecrons).byTrait(Trait.Psyker, true),
                    core: true
                },
                {
                    name: 'Min 4 hits',
                    points: 80,
                    units: filter(noNecrons).byMinHits(4),
                    core: true
                },
                {
                    name: 'Power',
                    points: 80,
                    units: filter(noNecrons).byDamageType(DamageType.Power),
                },
                {
                    name: 'No Range',
                    points: 60,
                    units: filter(noNecrons).byAttackType('meleeOnly'),
                    core: true
                },
            ],
        );
    }

    protected getBetaTrack(unitsData: Array<ICharacter>): ILegendaryEventTrack {
        const noTyranids = filter(unitsData).byFaction(Faction.Tyranids, true);
        return new LETrack(
            this.id,
            'beta',
            'Beta (No Tyranids)',
            19,
            noTyranids,
            [
                {
                    name: 'Mechanical',
                    points: 90,
                    units: filter(noTyranids).isMechanical(),
                },
                {
                    name: 'ASTRA MILITARUM',
                    points: 120,
                    units: filter(noTyranids).byFaction(Faction.Astra_militarum),
                },
                {
                    name: 'No Bolter',
                    points: 50,
                    units: filter(noTyranids).byDamageType(DamageType.Bolter, true),
                    core: true
                },
                {
                    name: 'No Piercing',
                    points: 50,
                    units:  filter(noTyranids).byDamageType(DamageType.Piercing, true),
                    core: true
                },
                {
                    name: 'No Summons',
                    points: 65,
                    units: filter(noTyranids).byNoSummons(),
                    core: true
                },
            ]
        );
    }

    protected getGammaTrack(unitsData: Array<ICharacter>): ILegendaryEventTrack {
        const noImperials = filter(unitsData).byAlliance(Alliance.Imperial, true);
        return new LETrack(
            this.id,
            'gamma',
            'Gamma (No Imperials)',
            35,
            noImperials,
            [
                {
                    name: 'No Piercing',
                    points: 40,
                    units: filter(noImperials).byDamageType(DamageType.Piercing, true),
                    core: true
                },
                {
                    name: 'Ranged',
                    points: 65,
                    units: filter(noImperials).byAttackType('rangeOnly'),
                    core: true
                },
                {
                    name: 'Min 3 hits',
                    points: 50,
                    units: filter(noImperials).byMinHits(3),
                    core: true
                },
                {
                    name: 'Power',
                    points: 100,
                    units:  filter(noImperials).byDamageType(DamageType.Power),
                },
                {
                    name: 'Black Legion',
                    points: 120,
                    units:  filter(noImperials).byFaction(Faction.Black_Legion),
                },
            ]
        );
    }

}