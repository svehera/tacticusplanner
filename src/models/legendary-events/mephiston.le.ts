import { ICharacter2, ILegendaryEventTrack } from '../interfaces';
import { Alliance, DamageType, Trait } from '../enums';
import { filter } from './filters';
import { LegendaryEventBase } from './base.le';
import { LETrack } from './base.le.track';

import staticData from '../../assets/legendary-events/Mephiston.json';

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
                    iconId: 'power',
                    index: 0,
                },
                {
                    name: 'Melee only',
                    points: 65,
                    units: filter(noImperial).byAttackType('meleeOnly'),
                    selected: true,
                    iconId: 'melee',
                    index: 1,
                },
                {
                    name: 'Min 2 hits',
                    points: 40,
                    units: filter(noImperial).byMinHits(2),
                    selected: true,
                    iconId: 'hits',
                    index: 2,
                },
                {
                    name: 'Flying',
                    points: 85,
                    units: filter(noImperial).byTrait(Trait.Flying),
                    iconId: 'flying',
                    index: 3,
                },
                {
                    name: 'Psychic',
                    points: 95,
                    units: filter(noImperial).byDamageType(DamageType.Psychic),
                    selected: false,
                    iconId: 'psychic',
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
                    iconId: 'physical',
                    index: 0,
                },
                {
                    name: 'Mechanical',
                    points: 95,
                    units: filter(noChaos).isMechanical(),
                    iconId: 'mech',
                    index: 1,
                },
                {
                    name: 'No Big Target',
                    points: 25,
                    units: filter(noChaos).byTrait(Trait.BigTarget, true),
                    selected: true,
                    iconId: 'no_bigTarget',
                    index: 2,
                },
                {
                    name: 'Min 3 hits',
                    points: 60,
                    units: filter(noChaos).byMinHits(3),
                    selected: true,
                    iconId: 'hits',
                    index: 3,
                },
                {
                    name: 'Piercing',
                    points: 105,
                    units: filter(noChaos).byDamageType(DamageType.Piercing),
                    selected: false,
                    iconId: 'piercing',
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
                    iconId: 'power',
                    index: 0,
                },
                {
                    name: 'Ranged',
                    points: 85,
                    units: filter(imperialOnly).byAttackType('rangeOnly'),
                    iconId: 'ranged',
                    index: 1,
                },
                {
                    name: 'No Mechanical',
                    points: 35,
                    units: filter(imperialOnly).isNotMechanical(),
                    selected: false,
                    iconId: 'no_mech',
                    index: 2,
                },
                {
                    name: 'Max 2 hits',
                    points: 85,
                    units: filter(imperialOnly).byMaxHits(2),
                    selected: false,
                    iconId: 'hits',
                    index: 3,
                },
                {
                    name: 'Min 3 hits',
                    points: 85,
                    units: filter(imperialOnly).byMinHits(3),
                    selected: false,
                    iconId: 'hits',
                    index: 4,
                },
            ],
            staticData.gamma
        );
    }
}
