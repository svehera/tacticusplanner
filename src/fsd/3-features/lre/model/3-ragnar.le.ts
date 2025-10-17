import { Alliance, DamageType, Trait, Faction } from '@/fsd/5-shared/model';

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
                    iconId: 'resilient',
                },
                {
                    name: 'Max 3 hits',
                    points: 40,
                    units: filter(noXenos).byMaxHits(3),
                    selected: true,
                    iconId: 'hits',
                },
                {
                    name: 'Melee only',
                    points: 70,
                    units: filter(noXenos).byAttackType('meleeOnly'),
                    iconId: 'melee',
                },
                {
                    name: 'Ranged',
                    points: 65,
                    units: filter(noXenos).byAttackType('rangeOnly'),
                    selected: true,
                    iconId: 'ranged',
                },
                {
                    name: 'Bolter',
                    points: 95,
                    units: filter(noXenos).byDamageType(DamageType.Bolter),
                    iconId: 'bolter',
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
                    iconId: 'hits',
                },
                {
                    name: 'Physical',
                    points: 90,
                    units: filter(noChaos).byDamageType(DamageType.Physical),
                    iconId: 'physical',
                },
                {
                    name: 'Power',
                    points: 90,
                    units: filter(noChaos).byDamageType(DamageType.Power),
                    iconId: 'power',
                },
                {
                    name: 'Flying',
                    points: 100,
                    units: filter(noChaos).byTrait(Trait.Flying),
                    iconId: 'flying',
                },
                {
                    name: 'No Summons',
                    points: 35,
                    units: filter(noChaos).byNoSummons(),
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
                    name: 'Piercing',
                    points: 105,
                    units: filter(noImperials).byDamageType(DamageType.Piercing),
                    iconId: 'piercing',
                },
                {
                    name: 'Melee only',
                    points: 85,
                    units: filter(noImperials).byAttackType('meleeOnly'),
                    iconId: 'melee',
                },
                {
                    name: 'No Physical',
                    points: 45,
                    units: filter(noImperials).byDamageType(DamageType.Physical, true),
                    selected: true,
                    iconId: 'no_physical',
                },
                {
                    name: 'Power',
                    points: 105,
                    units: filter(noImperials).byDamageType(DamageType.Power),
                    iconId: 'power',
                },
                {
                    name: 'No Black Legion',
                    points: 35,
                    units: filter(noImperials).byFaction(Faction.Black_Legion, true),
                    selected: true,
                    iconId: 'no_black_legion',
                },
            ],
            staticData.gamma
        );
    }
}
