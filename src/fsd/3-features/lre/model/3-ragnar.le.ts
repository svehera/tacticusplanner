import { Alliance, DamageType, Trait } from '@/fsd/5-shared/model';

import { ICharacter2 } from '@/fsd/4-entities/character';
import { ragnar as staticData } from '@/fsd/4-entities/lre';

import { ILegendaryEventTrack } from '../lre.model';

import { LegendaryEventBase } from './base.le';
import { LETrack } from './base.le.track';
import { filter } from './filters';

export class RagnarLegendaryEvent extends LegendaryEventBase {
    constructor(unitsData: Array<ICharacter2>) {
        super(unitsData, staticData);
    }

    protected getAlphaTrack(unitsData: Array<ICharacter2>): ILegendaryEventTrack {
        const noXenos = filter(unitsData).byAlliance(Alliance.Xenos, true);
        return new LETrack(
            this.id,
            'alpha',
            noXenos,
            [
                {
                    name: 'Resilient',
                    points: 105,
                    units: filter(noXenos).byTrait(Trait.Resilient),
                    objectiveType: 'Trait',
                    objectiveTarget: 'Resilient',
                },
                {
                    name: 'Max 3 hits',
                    points: 40,
                    units: filter(noXenos).byMaxHits(3),
                    selected: true,
                    objectiveType: 'MaxHits',
                    objectiveTarget: '3',
                },
                {
                    name: 'Melee only',
                    points: 70,
                    units: filter(noXenos).byAttackType('meleeOnly'),
                    objectiveType: 'HasNoRangedAttack',
                    objectiveTarget: '',
                },
                {
                    name: 'Ranged',
                    points: 65,
                    units: filter(noXenos).byAttackType('rangeOnly'),
                    selected: true,
                    objectiveType: 'HasRangedAttack',
                    objectiveTarget: '',
                },
                {
                    name: 'Bolter',
                    points: 95,
                    units: filter(noXenos).byDamageType(DamageType.Bolter),
                    objectiveType: 'DamageType',
                    objectiveTarget: 'Bolter',
                },
            ],
            staticData.alpha
        );
    }

    protected getBetaTrack(unitsData: Array<ICharacter2>): ILegendaryEventTrack {
        const noChaos = filter(unitsData).byAlliance(Alliance.Chaos, true);
        return new LETrack(
            this.id,
            'beta',
            noChaos,
            [
                {
                    name: 'Min 3 hit',
                    points: 60,
                    units: filter(noChaos).byMinHits(3),
                    selected: true,
                    objectiveType: 'MinHits',
                    objectiveTarget: '3',
                },
                {
                    name: 'Physical',
                    points: 90,
                    units: filter(noChaos).byDamageType(DamageType.Physical),
                    objectiveType: 'DamageType',
                    objectiveTarget: 'Physical',
                },
                {
                    name: 'Power',
                    points: 90,
                    units: filter(noChaos).byDamageType(DamageType.Power),
                    objectiveType: 'DamageType',
                    objectiveTarget: 'Power',
                },
                {
                    name: 'Flying',
                    points: 100,
                    units: filter(noChaos).byTrait(Trait.Flying),
                    objectiveType: 'Trait',
                    objectiveTarget: 'Flying',
                },
                {
                    name: 'No Summons',
                    points: 35,
                    units: filter(noChaos).byNoSummons(),
                    selected: true,
                    objectiveType: 'NoSummons',
                    objectiveTarget: '',
                },
            ],
            staticData.beta
        );
    }

    protected getGammaTrack(unitsData: Array<ICharacter2>): ILegendaryEventTrack {
        const noImperials = filter(unitsData).byAlliance(Alliance.Imperial, true);
        return new LETrack(
            this.id,
            'gamma',
            noImperials,
            [
                {
                    name: 'Piercing',
                    points: 105,
                    units: filter(noImperials).byDamageType(DamageType.Piercing),
                    objectiveType: 'DamageType',
                    objectiveTarget: 'Piercing',
                },
                {
                    name: 'Melee only',
                    points: 85,
                    units: filter(noImperials).byAttackType('meleeOnly'),
                    objectiveType: 'HasNoRangedAttack',
                    objectiveTarget: '',
                },
                {
                    name: 'No Physical',
                    points: 45,
                    units: filter(noImperials).byDamageType(DamageType.Physical, true),
                    selected: true,
                    objectiveType: 'NotDamageType',
                    objectiveTarget: 'Physical',
                },
                {
                    name: 'Power',
                    points: 105,
                    units: filter(noImperials).byDamageType(DamageType.Power),
                    objectiveType: 'DamageType',
                    objectiveTarget: 'Power',
                },
                {
                    name: 'No Black Legion',
                    points: 35,
                    units: filter(noImperials).byFaction('BlackLegion', true),
                    selected: true,
                    objectiveType: 'NotFaction',
                    objectiveTarget: 'BlackLegion',
                },
            ],
            staticData.gamma
        );
    }
}
