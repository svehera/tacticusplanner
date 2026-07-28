import { Alliance, DamageType, Trait } from '@/fsd/5-shared/model';

import { ICharacter2 } from '@/fsd/4-entities/character';
import { mephiston as staticData } from '@/fsd/4-entities/lre';

import { ILegendaryEventTrack } from '../lre.model';

import { LegendaryEventBase } from './base.le';
import { LETrack } from './base.le.track';
import { filter } from './filters';

export class MephistonLegendaryEvent extends LegendaryEventBase {
    constructor(unitsData: Array<ICharacter2>) {
        super(unitsData, staticData);
    }

    protected getAlphaTrack(unitsData: Array<ICharacter2>): ILegendaryEventTrack {
        const noImperial = filter(unitsData).byAlliance(Alliance.Imperial, true);
        return new LETrack(
            this.id,
            'alpha',
            noImperial,
            [
                {
                    name: 'Power',
                    points: 90,
                    units: filter(noImperial).byDamageType(DamageType.Power),
                    selected: false,
                    objectiveType: 'DamageType',
                    objectiveTarget: 'Power',
                    index: 0,
                },
                {
                    name: 'Melee only',
                    points: 65,
                    units: filter(noImperial).byAttackType('meleeOnly'),
                    selected: true,
                    objectiveType: 'HasNoRangedAttack',
                    objectiveTarget: '',
                    index: 1,
                },
                {
                    name: 'Min 2 hits',
                    points: 40,
                    units: filter(noImperial).byMinHits(2),
                    selected: true,
                    objectiveType: 'MinHits',
                    objectiveTarget: '2',
                    index: 2,
                },
                {
                    name: 'Flying',
                    points: 85,
                    units: filter(noImperial).byTrait(Trait.Flying),
                    objectiveType: 'Trait',
                    objectiveTarget: 'Flying',
                    index: 3,
                },
                {
                    name: 'Psychic',
                    points: 95,
                    units: filter(noImperial).byDamageType(DamageType.Psychic),
                    selected: false,
                    objectiveType: 'DamageType',
                    objectiveTarget: 'Psychic',
                    index: 4,
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
                    name: 'Physical',
                    points: 90,
                    units: filter(noChaos).byDamageType(DamageType.Physical),
                    selected: false,
                    objectiveType: 'DamageType',
                    objectiveTarget: 'Physical',
                    index: 0,
                },
                {
                    name: 'Mechanical',
                    points: 95,
                    units: filter(noChaos).isMechanical(),
                    objectiveType: 'Trait',
                    objectiveTarget: 'Mechanical',
                    index: 1,
                },
                {
                    name: 'No Big Target',
                    points: 25,
                    units: filter(noChaos).byTrait(Trait.BigTarget, true),
                    selected: true,
                    objectiveType: 'NotTrait',
                    objectiveTarget: 'BigTarget',
                    index: 2,
                },
                {
                    name: 'Min 3 hits',
                    points: 60,
                    units: filter(noChaos).byMinHits(3),
                    selected: true,
                    objectiveType: 'MinHits',
                    objectiveTarget: '3',
                    index: 3,
                },
                {
                    name: 'Piercing',
                    points: 105,
                    units: filter(noChaos).byDamageType(DamageType.Piercing),
                    selected: false,
                    objectiveType: 'DamageType',
                    objectiveTarget: 'Piercing',
                    index: 4,
                },
            ],
            staticData.beta
        );
    }

    protected getGammaTrack(unitsData: Array<ICharacter2>): ILegendaryEventTrack {
        const imperialOnly = filter(unitsData).byAlliance(Alliance.Imperial);
        return new LETrack(
            this.id,
            'gamma',
            imperialOnly,
            [
                {
                    name: 'Power',
                    points: 85,
                    units: filter(imperialOnly).byDamageType(DamageType.Power),
                    selected: false,
                    objectiveType: 'DamageType',
                    objectiveTarget: 'Power',
                    index: 0,
                },
                {
                    name: 'Ranged',
                    points: 85,
                    units: filter(imperialOnly).byAttackType('rangeOnly'),
                    objectiveType: 'HasRangedAttack',
                    objectiveTarget: '',
                    index: 1,
                },
                {
                    name: 'No Mechanical',
                    points: 35,
                    units: filter(imperialOnly).isNotMechanical(),
                    selected: false,
                    objectiveType: 'NotTrait',
                    objectiveTarget: 'Mechanical',
                    index: 2,
                },
                {
                    name: 'Max 2 hits',
                    points: 85,
                    units: filter(imperialOnly).byMaxHits(2),
                    selected: false,
                    objectiveType: 'MaxHits',
                    objectiveTarget: '2',
                    index: 3,
                },
                {
                    name: 'Min 3 hits',
                    points: 85,
                    units: filter(imperialOnly).byMinHits(3),
                    selected: false,
                    objectiveType: 'MinHits',
                    objectiveTarget: '3',
                    index: 4,
                },
            ],
            staticData.gamma
        );
    }
}
