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
                    iconId: 'big_target',
                },
                {
                    name: 'No Psykers',
                    points: 40,
                    units: filter(noNecrons).byTrait(Trait.Psyker, true),
                    selected: true,
                    iconId: 'no_psychic',
                },
                {
                    name: 'Min 4 hits',
                    points: 80,
                    units: filter(noNecrons).byMinHits(4),
                    selected: true,
                    iconId: 'hits',
                },
                {
                    name: 'Power',
                    points: 80,
                    units: filter(noNecrons).byDamageType(DamageType.Power),
                    iconId: 'power',
                },
                {
                    name: 'No Range',
                    points: 60,
                    units: filter(noNecrons).byAttackType('meleeOnly'),
                    selected: true,
                    iconId: 'melee',
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
                    iconId: 'mech',
                },
                {
                    name: 'ASTRA MILITARUM',
                    points: 120,
                    units: filter(noTyranids).byFaction('AstraMilitarum'),
                    iconId: 'astra_militarum',
                },
                {
                    name: 'No Bolter',
                    points: 50,
                    units: filter(noTyranids).byDamageType(DamageType.Bolter, true),
                    selected: true,
                    iconId: 'no_bolter',
                },
                {
                    name: 'No Piercing',
                    points: 50,
                    units: filter(noTyranids).byDamageType(DamageType.Piercing, true),
                    selected: true,
                    iconId: 'no_piercing',
                },
                {
                    name: 'No Summons',
                    points: 65,
                    units: filter(noTyranids).byNoSummons(),
                    selected: true,
                    iconId: 'no_summons',
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
                    iconId: 'no_piercing',
                },
                {
                    name: 'Ranged',
                    points: 65,
                    units: filter(noImperials).byAttackType('rangeOnly'),
                    selected: true,
                    iconId: 'ranged',
                },
                {
                    name: 'Min 3 hits',
                    points: 50,
                    units: filter(noImperials).byMinHits(3),
                    selected: true,
                    iconId: 'hits',
                },
                {
                    name: 'Power',
                    points: 100,
                    units: filter(noImperials).byDamageType(DamageType.Power),
                    iconId: 'power',
                },
                {
                    name: 'Black Legion',
                    points: 120,
                    units: filter(noImperials).byFaction('BlackLegion'),
                    iconId: 'black_legion',
                },
            ],
            staticData.gamma
        );
    }
}
