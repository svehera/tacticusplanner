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
                },
                {
                    name: 'Melee only',
                    points: 65,
                    units: filter(noImperial).byAttackType('meleeOnly'),
                    selected: true,
                },
                {
                    name: 'Min 2 hits',
                    points: 40,
                    units: filter(noImperial).byMinHits(2),
                    selected: true,
                },
                {
                    name: 'Flying',
                    points: 85,
                    units: filter(noImperial).byTrait(Trait.Flying),
                },
                {
                    name: 'Psychic',
                    points: 95,
                    units: filter(noImperial).byDamageType(DamageType.Psychic),
                    selected: false,
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
                },
                {
                    name: 'Mechanical',
                    points: 95,
                    units: filter(noChaos).isMechanical(),
                },
                {
                    name: 'No Big Target',
                    points: 25,
                    units: filter(noChaos).byTrait(Trait.BigTarget, true),
                    selected: true,
                },
                {
                    name: 'Min 3 hits',
                    points: 60,
                    units: filter(noChaos).byMinHits(3),
                    selected: true,
                },
                {
                    name: 'Piercing',
                    points: 105,
                    units: filter(noChaos).byDamageType(DamageType.Piercing),
                    selected: false,
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
                },
                {
                    name: 'Ranged',
                    points: 85,
                    units: filter(imperialOnly).byAttackType('rangeOnly'),
                },
                {
                    name: 'No Mechanical',
                    points: 35,
                    units: filter(imperialOnly).isNotMechanical(),
                    selected: false,
                },
                {
                    name: 'Max 2 hits',
                    points: 85,
                    units: filter(imperialOnly).byMaxHits(2),
                    selected: false,
                },
                {
                    name: 'Min 3 hits',
                    points: 85,
                    units: filter(imperialOnly).byMinHits(3),
                    selected: false,
                },
            ],
            staticData.gamma
        );
    }
}
