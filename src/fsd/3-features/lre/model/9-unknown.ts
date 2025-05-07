// eslint-disable-next-line import-x/no-internal-modules
import { ICharacter2 } from '@/models/interfaces';

import { Alliance } from '@/fsd/5-shared/model';

import { Trait, DamageType } from '@/fsd/4-entities/character';
import { unknown as staticData } from '@/fsd/4-entities/lre';

import { ILegendaryEventTrack } from '../lre.model';

import { LegendaryEventBase } from './base.le';
import { LETrack } from './base.le.track';
import { filter } from './filters';

export class UnknownLegendaryEvent extends LegendaryEventBase {
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
                    units: filter(noChaos).byTrait(Trait.Terrifying),
                    iconId: 'terrifying',
                    index: 0,
                },
                {
                    name: 'Physical',
                    points: 85,
                    units: filter(noChaos).byDamageType(DamageType.Physical),
                    iconId: 'physical',
                    index: 1,
                },
                {
                    name: 'Min 4 Hits',
                    points: 60,
                    units: filter(noChaos).byMinHits(4),
                    iconId: 'hits',
                    index: 2,
                },
                {
                    name: 'Infiltrate',
                    points: 85,
                    units: filter(noChaos).byTrait(Trait.Infiltrate),
                    iconId: 'infiltrate',
                    index: 3,
                },
                {
                    name: 'Piercing',
                    points: 95,
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
                    units: filter(noImperial).byTrait(Trait.Flying),
                    iconId: 'flying',
                    index: 0,
                },
                {
                    name: 'Power',
                    points: 95,
                    units: filter(noImperial).byDamageType(DamageType.Power),
                    iconId: 'power',
                    index: 1,
                },
                {
                    name: 'Mechanical',
                    points: 75,
                    units: filter(noImperial).isMechanical(),
                    iconId: 'mech',
                    index: 2,
                },
                {
                    name: 'No Physical',
                    points: 45,
                    units: filter(noImperial).byDamageType(DamageType.Physical, true),
                    iconId: 'no_physical',
                    index: 3,
                },
                {
                    name: 'Max 2 hits',
                    points: 70,
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
                    units: filter(noXenos).byTrait(Trait.Resilient),
                    iconId: 'resilient',
                    index: 0,
                },
                {
                    name: 'Psyker',
                    points: 95,
                    units: filter(noXenos).byTrait(Trait.Psyker),
                    iconId: 'psyker',
                    index: 1,
                },
                {
                    name: 'No Bolter',
                    points: 55,
                    units: filter(noXenos).byDamageType(DamageType.Bolter, true),
                    iconId: 'no_bolter',
                    index: 2,
                },
                {
                    name: 'Min 3 hits',
                    points: 70,
                    units: filter(noXenos).byMinHits(3),
                    selected: false,
                    iconId: 'hits',
                    index: 3,
                },
                {
                    name: 'Chain',
                    points: 65,
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
