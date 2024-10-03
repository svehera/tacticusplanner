import { ICharacter2, ILegendaryEventTrack } from '../interfaces';
import { Alliance, DamageType, Faction, Trait } from '../enums';
import { filter } from './filters';
import { LegendaryEventBase } from './base.le';
import { LETrack } from './base.le.track';

import staticData from '../../assets/legendary-events/Patermine.json';

export class PatermineLegendaryEvent extends LegendaryEventBase {
    constructor(unitsData: Array<ICharacter2>) {
        super(unitsData, staticData);
    }

    protected getAlphaTrack(unitsData: Array<ICharacter2>): ILegendaryEventTrack {
        const noOrks = filter(unitsData).byFaction(Faction.Orks, true);
        return new LETrack(
            this.id,
            'alpha',
            noOrks,
            [
                {
                    name: 'Physical',
                    points: 95,
                    units: filter(noOrks).byDamageType(DamageType.Physical),
                    selected: false,
                },
                {
                    name: 'Melee only',
                    points: 65,
                    units: filter(noOrks).byAttackType('meleeOnly'),
                    selected: true,
                },
                {
                    name: 'Max 4 hits',
                    points: 30,
                    units: filter(noOrks).byMaxHits(4),
                    selected: true,
                },
                {
                    name: 'Mechanical',
                    points: 85,
                    units: filter(noOrks).isMechanical(),
                },
                {
                    name: 'Bolter',
                    points: 100,
                    units: filter(noOrks).byDamageType(DamageType.Bolter),
                    selected: false,
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
                    name: 'Power',
                    points: 95,
                    units: filter(noImperial).byDamageType(DamageType.Power),
                    selected: false,
                },
                {
                    name: 'Flying',
                    points: 95,
                    units: filter(noImperial).byTrait(Trait.Flying),
                },
                {
                    name: 'No Summons',
                    points: 45,
                    units: filter(noImperial).byNoSummons(),
                    selected: true,
                },
                {
                    name: 'Melee only',
                    points: 70,
                    units: filter(noImperial).byAttackType('meleeOnly'),
                    selected: true,
                },
                {
                    name: 'Max 2 hits',
                    points: 70,
                    units: filter(noImperial).byMaxHits(2),
                    selected: false,
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
                    name: 'Piercing',
                    points: 110,
                    units: filter(noChaos).byDamageType(DamageType.Piercing),
                    selected: false,
                },
                {
                    name: 'No Overwatch',
                    points: 30,
                    units: filter(noChaos).byTrait(Trait.Overwatch, true),
                    selected: true,
                },
                {
                    name: 'No Final Vengeance',
                    points: 40,
                    units: filter(noChaos).byTrait(Trait.FinalVengeance, true),
                    selected: true,
                },
                {
                    name: 'Min 4 hits',
                    points: 100,
                    units: filter(noChaos).byMinHits(4),
                    selected: false,
                },
                {
                    name: 'Power',
                    points: 95,
                    units: filter(noChaos).byDamageType(DamageType.Power),
                    selected: false,
                },
            ],
            staticData.gamma
        );
    }
}
