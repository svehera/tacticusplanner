import staticData from '../../assets/legendary-events/Ragnar.json';
import { Alliance, DamageType, Faction, Trait } from '../enums';
import { ICharacter2, ILegendaryEventTrack } from '../interfaces';

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
                },
                {
                    name: 'Max 3 hits',
                    points: 40,
                    units: filter(noXenos).byMaxHits(3),
                    selected: true,
                },
                {
                    name: 'Melee only',
                    points: 70,
                    units: filter(noXenos).byAttackType('meleeOnly'),
                },
                {
                    name: 'Ranged',
                    points: 65,
                    units: filter(noXenos).byAttackType('rangeOnly'),
                    selected: true,
                },
                {
                    name: 'Bolter',
                    points: 95,
                    units: filter(noXenos).byDamageType(DamageType.Bolter),
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
                },
                {
                    name: 'Physical',
                    points: 90,
                    units: filter(noChaos).byDamageType(DamageType.Physical),
                },
                {
                    name: 'Power',
                    points: 90,
                    units: filter(noChaos).byDamageType(DamageType.Power),
                },
                {
                    name: 'Flying',
                    points: 100,
                    units: filter(noChaos).byTrait(Trait.Flying),
                },
                {
                    name: 'No Summons',
                    points: 35,
                    units: filter(noChaos).byNoSummons(),
                    selected: true,
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
                },
                {
                    name: 'Melee only',
                    points: 85,
                    units: filter(noImperials).byAttackType('meleeOnly'),
                },
                {
                    name: 'No Physical',
                    points: 45,
                    units: filter(noImperials).byDamageType(DamageType.Physical, true),
                    selected: true,
                },
                {
                    name: 'Power',
                    points: 105,
                    units: filter(noImperials).byDamageType(DamageType.Power),
                },
                {
                    name: 'No Black Legion',
                    points: 35,
                    units: filter(noImperials).byFaction(Faction.Black_Legion, true),
                    selected: true,
                },
            ],
            staticData.gamma
        );
    }
}
