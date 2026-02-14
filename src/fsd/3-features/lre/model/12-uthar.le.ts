import { Alliance, Trait, DamageType } from '@/fsd/5-shared/model';

import { ICharacter2 } from '@/fsd/4-entities/character';
import { uthar as staticData } from '@/fsd/4-entities/lre';

import { ILegendaryEventTrack } from '../lre.model';

import { LegendaryEventBase } from './base.le';
import { LETrack } from './base.le.track';
import { filter } from './filters';

export class UtharLegendaryEvent extends LegendaryEventBase {
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
                    name: 'Ultramarines',
                    points: 75,
                    objectiveType: 'Faction',
                    objectiveTarget: 'Ultramarines',
                    units: filter(noXenos).byFaction('Ultramarines', /*not=*/ false),
                    iconId: 'ultramarines',
                    index: 0,
                },
                {
                    name: 'Resilient',
                    points: 95,
                    objectiveType: 'Trait',
                    objectiveTarget: 'Resilient',
                    units: filter(noXenos).byTrait(Trait.Resilient),
                    iconId: 'resilient',
                    index: 1,
                },
                {
                    name: 'Max 2 Hits',
                    points: 50,
                    objectiveType: 'MaxHits',
                    objectiveTarget: '2',
                    units: filter(noXenos).byMaxHits(2),
                    iconId: 'hits',
                    index: 2,
                },
                {
                    name: 'Melee',
                    points: 65,
                    objectiveType: 'AttackType',
                    objectiveTarget: 'Melee',
                    units: filter(noXenos).byAttackType('meleeOnly'),
                    iconId: 'melee',
                    index: 3,
                },
                {
                    name: 'Piercing',
                    points: 90,
                    objectiveType: 'DamageType',
                    objectiveTarget: 'Piercing',
                    units: filter(noXenos).byDamageType(DamageType.Piercing),
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
                    name: 'Ranged',
                    points: 60,
                    objectiveType: 'AttackType',
                    objectiveTarget: 'Ranged',
                    units: filter(noImperial).byAttackType('rangeOnly'),
                    iconId: 'ranged',
                    index: 0,
                },
                {
                    name: 'No Psyker',
                    points: 55,
                    objectiveType: 'Trait',
                    objectiveTarget: 'No Psyker',
                    units: filter(noImperial).byTrait(Trait.Psyker, true),
                    iconId: 'no_psychic',
                    index: 1,
                },
                {
                    name: 'Terminator',
                    points: 85,
                    objectiveType: 'Trait',
                    objectiveTarget: 'TerminatorArmour',
                    units: filter(noImperial).byTrait(Trait.TerminatorArmour),
                    iconId: 'terminator',
                    index: 2,
                },
                {
                    name: 'Psychic Damage',
                    points: 100,
                    objectiveType: 'DamageType',
                    objectiveTarget: 'Psychic',
                    units: filter(noImperial).byDamageType(DamageType.Psychic),
                    iconId: 'psychic',
                    index: 3,
                },
                {
                    name: 'Min 5 Hits',
                    points: 75,
                    objectiveType: 'MaxHits',
                    objectiveTarget: '5',
                    units: filter(noImperial).byMinHits(5),
                    iconId: 'hits',
                    index: 4,
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
                    name: 'No Power',
                    points: 50,
                    objectiveType: 'NotDamageType',
                    objectiveTarget: 'Power',
                    units: filter(noChaos).byDamageType(DamageType.Power, true),
                    iconId: 'no_power',
                    index: 0,
                },
                {
                    name: 'Bolter',
                    points: 85,
                    objectiveType: 'DamageType',
                    objectiveTarget: 'Bolter',
                    units: filter(noChaos).byDamageType(DamageType.Bolter),
                    iconId: 'bolter',
                    index: 1,
                },
                {
                    name: 'Mechanical',
                    points: 100,
                    objectiveType: 'Trait',
                    objectiveTarget: 'Mechanical',
                    units: filter(noChaos).byTrait(Trait.Mechanical),
                    iconId: 'mechanical',
                    index: 2,
                },
                {
                    name: 'Max 1 Hit',
                    points: 75,
                    objectiveType: 'MaxHits',
                    objectiveTarget: '1',
                    units: filter(noChaos).byMaxHits(1),
                    iconId: 'hits',
                    index: 3,
                },
                {
                    name: 'Big Target',
                    points: 65,
                    objectiveType: 'Trait',
                    objectiveTarget: 'BigTarget',
                    units: filter(noChaos).byTrait(Trait.BigTarget),
                    iconId: 'big_target',
                    index: 4,
                },
            ],
            staticData.gamma
        );
    }
}
