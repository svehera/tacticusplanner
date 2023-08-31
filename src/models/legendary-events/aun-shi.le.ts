﻿import { ICharacter, ILegendaryEventTrack, ITableRow } from '../interfaces';
import { Alliance, DamageType, Faction, Trait, LegendaryEvents } from '../enums';
import { filter } from './filters';
import { LegendaryEventBase } from './base.le';
import { LETrack } from './base.le.track';

export class AunShiLegendaryEvent extends LegendaryEventBase {

    constructor(unitsData: Array<ICharacter>, selectedTeams: ITableRow[]) {
        super(LegendaryEvents.AunShi, unitsData, selectedTeams);
    }

    protected getAlphaTrack(unitsData: Array<ICharacter>): ILegendaryEventTrack {
        const noOrks = filter(unitsData).byFaction(Faction.Orks, true);
        return new LETrack(
            'Alpha (No Orks)',
            29,
            noOrks,
            [
                {
                    name: 'Piercing',
                    points: 115,
                    units: filter(noOrks).byDamageType(DamageType.Piercing),
                },
                {
                    name: 'No Physical',
                    points: 40,
                    units: filter(noOrks).byDamageType(DamageType.Physical, true),
                },
                {
                    name: 'Max 3 hits',
                    points: 70,
                    units: filter(noOrks).byMaxHits(2),
                },
                {
                    name: 'No Range',
                    points: 80,
                    units: filter(noOrks).byAttackType('meleeOnly'),
                },
                {
                    name: 'Min 3 hits',
                    points: 70,
                    units: filter(noOrks).byMinHits(3),
                },
            ],
        );
    }

    protected getBetaTrack(unitsData: Array<ICharacter>): ILegendaryEventTrack {
        const noImperials = filter(unitsData).byAlliance(Alliance.Imperial, true);
        return new LETrack(
            'Beta (No Imperials)',
            53,
            noImperials,
            [
                {
                    name: 'Mechanical',
                    points: 105,
                    units: filter(noImperials).isMechanical(),
                },
                {
                    name: 'No Resiliant',
                    points: 40,
                    units: filter(noImperials).byTrait(Trait.Resilient, true),
                },
                {
                    name: 'No Range',
                    points: 85,
                    units:  filter(noImperials).byAttackType('meleeOnly'),
                },
                {
                    name: 'No Summons',
                    points: 45,
                    units: filter(noImperials).byNoSummons(),
                },
                {
                    name: 'Physical',
                    points: 100,
                    units: filter(noImperials).byDamageType(DamageType.Physical),
                },
            ]
        );
    }

    protected getGammaTrack(unitsData: Array<ICharacter>): ILegendaryEventTrack {
        const noChaos = filter(unitsData).byAlliance(Alliance.Chaos, true);
        return new LETrack(
            'Gamma (No Chaos)',
            40,
            noChaos,
            [
                {
                    name: 'Physical',
                    points: 120,
                    units: filter(noChaos).byDamageType(DamageType.Physical),
                },
                {
                    name: 'Max 1 hit',
                    points: 125,
                    units: filter(noChaos).byMaxHits(1),
                },
                {
                    name: 'No Flying',
                    points: 40,
                    units: filter(noChaos).byTrait(Trait.Flying, true),
                },
                {
                    name: 'No Overwatch',
                    points: 40,
                    units:  filter(noChaos).byTrait(Trait.Overwatch, true),
                },
                {
                    name: 'No Power',
                    points: 50,
                    units:  filter(noChaos).byDamageType(DamageType.Power, true),
                },
            ]
        ); 
    }

}