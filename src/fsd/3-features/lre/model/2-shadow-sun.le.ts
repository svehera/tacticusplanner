import { Alliance, DamageType, Trait } from '@/fsd/5-shared/model';

import { ICharacter2 } from '@/fsd/4-entities/character';
import { shadowsun as staticData } from '@/fsd/4-entities/lre';

import { ILegendaryEventTrack } from '../lre.model';

import { LegendaryEventBase } from './base.le';
import { LETrack } from './base.le.track';
import { filter } from './filters';

export class ShadowSunLegendaryEvent extends LegendaryEventBase {
    constructor(unitsData: Array<ICharacter2>) {
        super(unitsData, staticData);
    }

    protected getAlphaTrack(unitsData: Array<ICharacter2>): ILegendaryEventTrack {
        const noNecrons = filter(unitsData).byFaction('Necrons', true);
        return new LETrack(
            this.id,
            'alpha',
            noNecrons,
            [
                {
                    name: 'Big Target',
                    points: 115,
                    units: filter(noNecrons).byTrait(Trait.BigTarget),
                    objectiveType: 'Trait',
                    objectiveTarget: 'BigTarget',
                },
                {
                    name: 'No Psykers',
                    points: 40,
                    units: filter(noNecrons).byTrait(Trait.Psyker, true),
                    selected: true,
                    objectiveType: 'NotTrait',
                    objectiveTarget: 'Psyker',
                },
                {
                    name: 'Min 4 hits',
                    points: 80,
                    units: filter(noNecrons).byMinHits(4),
                    selected: true,
                    objectiveType: 'MinHits',
                    objectiveTarget: '4',
                },
                {
                    name: 'Power',
                    points: 80,
                    units: filter(noNecrons).byDamageType(DamageType.Power),
                    objectiveType: 'DamageType',
                    objectiveTarget: 'Power',
                },
                {
                    name: 'No Range',
                    points: 60,
                    units: filter(noNecrons).byAttackType('meleeOnly'),
                    selected: true,
                    objectiveType: 'HasNoRangedAttack',
                    objectiveTarget: '',
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
                    name: 'Mechanical',
                    points: 90,
                    units: filter(noTyranids).isMechanical(),
                    objectiveType: 'Trait',
                    objectiveTarget: 'Mechanical',
                },
                {
                    name: 'ASTRA MILITARUM',
                    points: 120,
                    units: filter(noTyranids).byFaction('AstraMilitarum'),
                    objectiveType: 'Faction',
                    objectiveTarget: 'AstraMilitarum',
                },
                {
                    name: 'No Bolter',
                    points: 50,
                    units: filter(noTyranids).byDamageType(DamageType.Bolter, true),
                    selected: true,
                    objectiveType: 'NotDamageType',
                    objectiveTarget: 'Bolter',
                },
                {
                    name: 'No Piercing',
                    points: 50,
                    units: filter(noTyranids).byDamageType(DamageType.Piercing, true),
                    selected: true,
                    objectiveType: 'NotDamageType',
                    objectiveTarget: 'Piercing',
                },
                {
                    name: 'No Summons',
                    points: 65,
                    units: filter(noTyranids).byNoSummons(),
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
                    name: 'No Piercing',
                    points: 40,
                    units: filter(noImperials).byDamageType(DamageType.Piercing, true),
                    selected: true,
                    objectiveType: 'NotDamageType',
                    objectiveTarget: 'Piercing',
                },
                {
                    name: 'Ranged',
                    points: 65,
                    units: filter(noImperials).byAttackType('rangeOnly'),
                    selected: true,
                    objectiveType: 'HasRangedAttack',
                    objectiveTarget: '',
                },
                {
                    name: 'Min 3 hits',
                    points: 50,
                    units: filter(noImperials).byMinHits(3),
                    selected: true,
                    objectiveType: 'MinHits',
                    objectiveTarget: '3',
                },
                {
                    name: 'Power',
                    points: 100,
                    units: filter(noImperials).byDamageType(DamageType.Power),
                    objectiveType: 'DamageType',
                    objectiveTarget: 'Power',
                },
                {
                    name: 'Black Legion',
                    points: 120,
                    units: filter(noImperials).byFaction('BlackLegion'),
                    objectiveType: 'Faction',
                    objectiveTarget: 'BlackLegion',
                },
            ],
            staticData.gamma
        );
    }
}
