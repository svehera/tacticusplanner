import { Alliance, Trait, DamageType } from '@/fsd/5-shared/model';

import { ICharacter2 } from '@/fsd/4-entities/character';
import { trajann as staticData } from '@/fsd/4-entities/lre';

import { ILegendaryEventTrack } from '../lre.model';

import { LegendaryEventBase } from './base.le';
import { LETrack } from './base.le.track';
import { filter } from './filters';

export class TrajannLegendaryEvent extends LegendaryEventBase {
    constructor(unitsData: Array<ICharacter2>) {
        super(unitsData, staticData);
    }

    protected getAlphaTrack(unitsData: Array<ICharacter2>): ILegendaryEventTrack {
        const noChaos = filter(unitsData).byAlliance(Alliance.Chaos, true);
        return new LETrack(
            this.id,
            'alpha',
            noChaos,
            [
                {
                    name: 'Terrifying',
                    points: 50,
                    objectiveType: 'Trait',
                    objectiveTarget: 'Terrifying',
                    units: filter(noChaos).byTrait(Trait.Terrifying),
                    iconId: 'terrifying',
                    index: 0,
                },
                {
                    name: 'Physical',
                    points: 85,
                    objectiveType: 'DamageType',
                    objectiveTarget: 'Physical',
                    units: filter(noChaos).byDamageType(DamageType.Physical),
                    iconId: 'physical',
                    index: 1,
                },
                {
                    name: 'Min 4 Hits',
                    points: 60,
                    objectiveType: 'MinHits',
                    objectiveTarget: '4',
                    units: filter(noChaos).byMinHits(4),
                    iconId: 'hits',
                    index: 2,
                },
                {
                    name: 'Infiltrate',
                    points: 85,
                    objectiveType: 'Trait',
                    objectiveTarget: 'Infiltrate',
                    units: filter(noChaos).byTrait(Trait.Infiltrate),
                    iconId: 'infiltrate',
                    index: 3,
                },
                {
                    name: 'Piercing',
                    points: 95,
                    objectiveType: 'DamageType',
                    objectiveTarget: 'Piercing',
                    units: filter(noChaos).byDamageType(DamageType.Piercing),
                    iconId: 'piercing',
                    index: 4,
                },
            ],
            staticData.alpha
        );
    }

    protected getBetaTrack(unitsData: Array<ICharacter2>): ILegendaryEventTrack {
        const noImperial = filter(unitsData).byAlliance(Alliance.Imperial, true);
        return new LETrack(
            this.id,
            'beta',
            noImperial,
            [
                {
                    name: 'Flying',
                    points: 90,
                    objectiveType: 'Trait',
                    objectiveTarget: 'Flying',
                    units: filter(noImperial).byTrait(Trait.Flying),
                    iconId: 'flying',
                    index: 0,
                },
                {
                    name: 'Power',
                    points: 95,
                    objectiveType: 'DamageType',
                    objectiveTarget: 'Power',
                    units: filter(noImperial).byDamageType(DamageType.Power),
                    iconId: 'power',
                    index: 1,
                },
                {
                    name: 'Mechanical',
                    points: 75,
                    objectiveType: 'Trait',
                    objectiveTarget: 'Mechanical',
                    units: filter(noImperial).isMechanical(),
                    iconId: 'mech',
                    index: 2,
                },
                {
                    name: 'No Physical',
                    points: 45,
                    objectiveType: 'NotDamageType',
                    objectiveTarget: 'Physical',
                    units: filter(noImperial).byDamageType(DamageType.Physical, true),
                    iconId: 'no_physical',
                    index: 3,
                },
                {
                    name: 'Max 2 hits',
                    points: 70,
                    objectiveType: 'MaxHits',
                    objectiveTarget: '2',
                    units: filter(noImperial).byMaxHits(2),
                    iconId: 'hits',
                    index: 4,
                },
            ],
            staticData.beta
        );
    }

    protected getGammaTrack(unitsData: Array<ICharacter2>): ILegendaryEventTrack {
        const noXenos = filter(unitsData).byAlliance(Alliance.Xenos, true);
        return new LETrack(
            this.id,
            'gamma',
            noXenos,
            [
                {
                    name: 'Resilient',
                    points: 90,
                    objectiveType: 'Trait',
                    objectiveTarget: 'Resilient',
                    units: filter(noXenos).byTrait(Trait.Resilient),
                    iconId: 'resilient',
                    index: 0,
                },
                {
                    name: 'Psyker',
                    points: 95,
                    objectiveType: 'Trait',
                    objectiveTarget: 'Psyker',
                    units: filter(noXenos).byTrait(Trait.Psyker),
                    iconId: 'psyker',
                    index: 1,
                },
                {
                    name: 'No Bolter',
                    points: 55,
                    objectiveType: 'NotDamageType',
                    objectiveTarget: 'Bolter',
                    units: filter(noXenos).byDamageType(DamageType.Bolter, true),
                    iconId: 'no_bolter',
                    index: 2,
                },
                {
                    name: 'Min 3 hits',
                    points: 70,
                    objectiveType: 'MinHits',
                    objectiveTarget: '3',
                    units: filter(noXenos).byMinHits(3),
                    selected: false,
                    iconId: 'hits',
                    index: 3,
                },
                {
                    name: 'Chain',
                    points: 65,
                    objectiveType: 'DamageType',
                    objectiveTarget: 'Chain',
                    units: filter(noXenos).byDamageType(DamageType.Chain),
                    selected: false,
                    iconId: 'chain',
                    index: 4,
                },
            ],
            staticData.gamma
        );
    }
}
