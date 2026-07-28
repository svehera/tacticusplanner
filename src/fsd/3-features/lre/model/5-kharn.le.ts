import { Alliance, DamageType, Trait } from '@/fsd/5-shared/model';

import { ICharacter2 } from '@/fsd/4-entities/character';
import { kharn as staticData } from '@/fsd/4-entities/lre';

import { ILegendaryEventTrack } from '../lre.model';

import { LegendaryEventBase } from './base.le';
import { LETrack } from './base.le.track';
import { filter } from './filters';

export class KharnLegendaryEvent extends LegendaryEventBase {
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
                    name: 'No Psychic',
                    points: 35,
                    units: filter(noImperial).byDamageType(DamageType.Psychic, true),
                    selected: true,
                    objectiveType: 'NotDamageType',
                    objectiveTarget: 'Psychic',
                    index: 0,
                },
                {
                    name: 'Ranged',
                    points: 75,
                    units: filter(noImperial).byAttackType('rangeOnly'),
                    selected: true,
                    objectiveType: 'HasRangedAttack',
                    objectiveTarget: '',
                    index: 1,
                },
                {
                    name: 'Max 1 hit',
                    points: 105,
                    units: filter(noImperial).byMaxHits(1),
                    objectiveType: 'MaxHits',
                    objectiveTarget: '1',
                    index: 2,
                },
                {
                    name: 'Resilient',
                    points: 95,
                    units: filter(noImperial).byTrait(Trait.Resilient),
                    objectiveType: 'Trait',
                    objectiveTarget: 'Resilient',
                    index: 3,
                },
                {
                    name: 'No Summons',
                    points: 65,
                    units: filter(noImperial).byNoSummons(),
                    selected: true,
                    objectiveType: 'NoSummons',
                    objectiveTarget: '',
                    index: 4,
                },
            ],
            staticData.alpha
        );
    }

    protected getBetaTrack(unitsData: Array<ICharacter2>): ILegendaryEventTrack {
        const noTyranids = filter(unitsData).byFaction('Tyranids', true);
        return new LETrack(
            this.id,
            'beta',
            noTyranids,
            [
                {
                    name: 'Min 3 hits',
                    points: 75,
                    units: filter(noTyranids).byMinHits(3),
                    selected: true,
                    objectiveType: 'MinHits',
                    objectiveTarget: '3',
                    index: 0,
                },
                {
                    name: 'Flame',
                    points: 130,
                    units: filter(noTyranids).byDamageType(DamageType.Flame),
                    objectiveType: 'DamageType',
                    objectiveTarget: 'Flame',
                    index: 1,
                },
                {
                    name: 'No Terminator Armour',
                    points: 25,
                    units: filter(noTyranids).byTrait(Trait.TerminatorArmour, true),
                    selected: true,
                    objectiveType: 'NotTrait',
                    objectiveTarget: 'TerminatorArmour',
                    index: 2,
                },
                {
                    name: 'No Big Target',
                    points: 25,
                    units: filter(noTyranids).byTrait(Trait.BigTarget, true),
                    selected: true,
                    objectiveType: 'NotTrait',
                    objectiveTarget: 'BigTarget',
                    index: 3,
                },
                {
                    name: 'Mechanical',
                    points: 120,
                    units: filter(noTyranids).isMechanical(),
                    objectiveType: 'Trait',
                    objectiveTarget: 'Mechanical',
                    index: 4,
                },
            ],
            staticData.beta
        );
    }

    protected getGammaTrack(unitsData: Array<ICharacter2>): ILegendaryEventTrack {
        const noThousandSons = filter(unitsData).byFaction('ThousandSons', true);
        return new LETrack(
            this.id,
            'gamma',
            noThousandSons,
            [
                {
                    name: 'No Mechanical',
                    points: 30,
                    units: filter(noThousandSons).isNotMechanical(),
                    selected: true,
                    objectiveType: 'NotTrait',
                    objectiveTarget: 'Mechanical',
                    index: 0,
                },
                {
                    name: 'Physical',
                    points: 95,
                    units: filter(noThousandSons).byDamageType(DamageType.Physical),
                    selected: true,
                    objectiveType: 'DamageType',
                    objectiveTarget: 'Physical',
                    index: 1,
                },
                {
                    name: 'Piercing',
                    points: 105,
                    units: filter(noThousandSons).byDamageType(DamageType.Piercing),
                    objectiveType: 'DamageType',
                    objectiveTarget: 'Piercing',
                    index: 2,
                },
                {
                    name: 'Min 5 hits',
                    points: 115,
                    units: filter(noThousandSons).byMinHits(5),
                    objectiveType: 'MinHits',
                    objectiveTarget: '5',
                    index: 3,
                },
                {
                    name: 'No Flying',
                    points: 30,
                    units: filter(noThousandSons).byTrait(Trait.Flying, true),
                    selected: true,
                    objectiveType: 'NotTrait',
                    objectiveTarget: 'Flying',
                    index: 4,
                },
            ],
            staticData.gamma
        );
    }
}
