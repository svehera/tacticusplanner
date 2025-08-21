import { Alliance, DamageType, Trait, Faction } from '@/fsd/5-shared/model';

import { ICharacter2 } from '@/fsd/4-entities/character';
import { LegendaryEventEnum, aunshi as staticData } from '@/fsd/4-entities/lre';

import { ILegendaryEventTrack } from '../lre.model';

import { LegendaryEventBase } from './base.le';
import { LETrack } from './base.le.track';
import { filter } from './filters';

export class AunShiLegendaryEvent extends LegendaryEventBase {
    constructor(unitsData: Array<ICharacter2>) {
        super(unitsData, staticData);
    }

    protected getAlphaTrack(unitsData: Array<ICharacter2>): ILegendaryEventTrack {
        const noOrks = filter(unitsData).byFaction(Faction.Orks, true);
        return new LETrack(
            this.id,
            'alpha',
            noOrks,
            [
                {
                    name: 'Piercing',
                    points: 115,
                    units: filter(noOrks).byDamageType(DamageType.Piercing),
                    iconId: 'piercing',
                },
                {
                    name: 'No Physical',
                    points: 40,
                    units: filter(noOrks).byDamageType(DamageType.Physical, true),
                    selected: true,
                    iconId: 'no_physical',
                },
                {
                    name: 'Max 2 hits',
                    points: 70,
                    units: filter(noOrks).byMaxHits(2),
                    iconId: 'hits',
                },
                {
                    name: 'No Range',
                    points: 80,
                    units: filter(noOrks).byAttackType('meleeOnly'),
                    selected: true,
                    iconId: 'melee',
                },
                {
                    name: 'Min 3 hits',
                    points: 70,
                    units: filter(noOrks).byMinHits(3),
                    selected: true,
                    iconId: 'hits',
                },
            ],
            staticData.alpha
        );
    }

    protected getBetaTrack(unitsData: Array<ICharacter2>): ILegendaryEventTrack {
        const noImperials = filter(unitsData).byAlliance(Alliance.Imperial, true);
        return new LETrack(
            this.id,
            'beta',
            noImperials,
            [
                {
                    name: 'Mechanical',
                    points: 105,
                    units: filter(noImperials).isMechanical(),
                    iconId: 'mech',
                },
                {
                    name: 'No Resiliant',
                    points: 40,
                    units: filter(noImperials).byTrait(Trait.Resilient, true),
                    selected: true,
                    iconId: 'no_resiliant',
                },
                {
                    name: 'No Range',
                    points: 85,
                    units: filter(noImperials).byAttackType('meleeOnly'),
                    selected: true,
                    iconId: 'melee',
                },
                {
                    name: 'No Summons',
                    points: 45,
                    units: filter(noImperials).byNoSummons(),
                    selected: true,
                    iconId: 'no_summons',
                },
                {
                    name: 'Physical',
                    points: 100,
                    units: filter(noImperials).byDamageType(DamageType.Physical),
                    iconId: 'physical',
                },
            ],
            staticData.beta
        );
    }

    protected getGammaTrack(unitsData: Array<ICharacter2>): ILegendaryEventTrack {
        const noChaos = filter(unitsData).byAlliance(Alliance.Chaos, true);
        return new LETrack(
            this.id,
            'gamma',
            noChaos,
            [
                {
                    name: 'Physical',
                    points: 120,
                    units: filter(noChaos).byDamageType(DamageType.Physical),
                    iconId: 'physical',
                },
                {
                    name: 'Max 1 hit',
                    points: 125,
                    units: filter(noChaos).byMaxHits(1),
                    iconId: 'hits',
                },
                {
                    name: 'No Flying',
                    points: 40,
                    units: filter(noChaos).byTrait(Trait.Flying, true),
                    selected: true,
                    iconId: 'no_flying',
                },
                {
                    name: 'No Overwatch',
                    points: 40,
                    units: filter(noChaos).byTrait(Trait.Overwatch, true),
                    selected: true,
                    iconId: 'no_overwatch',
                },
                {
                    name: 'No Power',
                    points: 50,
                    units: filter(noChaos).byDamageType(DamageType.Power, true),
                    selected: true,
                    iconId: 'no_power',
                },
            ],
            staticData.gamma
        );
    }
}
