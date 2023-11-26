import { ICharacter2, ILegendaryEventTrack } from '../interfaces';
import { Alliance, DamageType, Faction, Trait } from '../enums';
import { filter } from './filters';
import { LegendaryEventBase } from './base.le';
import { LETrack } from './base.le.track';

import staticData from '../../assets/legendary-events/Vitrivius.json';

export class VitriviusLegendaryEvent extends LegendaryEventBase {
    constructor(unitsData: Array<ICharacter2>) {
        super(unitsData, staticData);
    }

    protected getAlphaTrack(unitsData: Array<ICharacter2>): ILegendaryEventTrack {
        const noNecrons = filter(unitsData).byFaction(Faction.Necrons, true);
        return new LETrack(
            this.id,
            'alpha',
            noNecrons,
            [
                {
                    name: 'No Psychic',
                    points: 40,
                    units: filter(noNecrons).byDamageType(DamageType.Psychic, true),
                    selected: true,
                },
                {
                    name: 'Ranged',
                    points: 75,
                    units: filter(noNecrons).byAttackType('rangeOnly'),
                    selected: true,
                },
                {
                    name: 'Max 1 hit',
                    points: 120,
                    units: filter(noNecrons).byMaxHits(1),
                },
                {
                    name: 'Power',
                    points: 105,
                    units: filter(noNecrons).byDamageType(DamageType.Power),
                },
                {
                    name: 'No Resilient',
                    points: 35,
                    units: filter(noNecrons).byTrait(Trait.Resilient, true),
                    selected: true,
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
                    name: 'Max 2 hits',
                    points: 75,
                    units: filter(noChaos).byMaxHits(2),
                },
                {
                    name: 'Piercing',
                    points: 115,
                    units: filter(noChaos).byDamageType(DamageType.Piercing),
                },
                {
                    name: 'Bolter',
                    points: 105,
                    units: filter(noChaos).byDamageType(DamageType.Bolter),
                },
                {
                    name: 'No Infiltrate',
                    points: 30,
                    units: filter(noChaos).byTrait(Trait.Infiltrate, true),
                    selected: true,
                },
                {
                    name: 'No Summons',
                    points: 50,
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
                    name: 'No Flying',
                    points: 60,
                    units: filter(noImperials).byTrait(Trait.Flying, true),
                    selected: true,
                },
                {
                    name: 'No Death Guard',
                    points: 35,
                    units: filter(noImperials).byFaction(Faction.Death_Guard, true),
                    selected: true,
                },
                {
                    name: 'Power',
                    points: 125,
                    units: filter(noImperials).byDamageType(DamageType.Power),
                },
                {
                    name: 'No Psykers',
                    points: 45,
                    units: filter(noImperials).byTrait(Trait.Psyker, true),
                    selected: true,
                },
                {
                    name: 'Max 2 hits',
                    points: 110,
                    units: filter(noImperials).byMaxHits(2),
                },
            ],
            staticData.gamma
        );
    }
}
