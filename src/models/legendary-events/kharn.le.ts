import staticData from '../../assets/legendary-events/Kharn.json';
import { Alliance, DamageType, Faction, Trait } from '../enums';
import { ICharacter2, ILegendaryEventTrack } from '../interfaces';

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
                    iconId: 'no_psychic',
                    index: 0,
                },
                {
                    name: 'Ranged',
                    points: 75,
                    units: filter(noImperial).byAttackType('rangeOnly'),
                    selected: true,
                    iconId: 'ranged',
                    index: 1,
                },
                {
                    name: 'Max 1 hit',
                    points: 105,
                    units: filter(noImperial).byMaxHits(1),
                    iconId: 'hits',
                    index: 2,
                },
                {
                    name: 'Resilient',
                    points: 95,
                    units: filter(noImperial).byTrait(Trait.Resilient),
                    iconId: 'resilient',
                    index: 3,
                },
                {
                    name: 'No Summons',
                    points: 65,
                    units: filter(noImperial).byNoSummons(),
                    selected: true,
                    iconId: 'no_summons',
                    index: 4,
                },
            ],
            staticData.alpha
        );
    }

    protected getBetaTrack(unitsData: Array<ICharacter2>): ILegendaryEventTrack {
        const noTyranids = filter(unitsData).byFaction(Faction.Tyranids, true);
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
                    iconId: 'hits',
                    index: 0,
                },
                {
                    name: 'Flame',
                    points: 130,
                    units: filter(noTyranids).byDamageType(DamageType.Flame),
                    iconId: 'flame',
                    index: 1,
                },
                {
                    name: 'No Terminator Armour',
                    points: 25,
                    units: filter(noTyranids).byTrait(Trait.TerminatorArmour, true),
                    selected: true,
                    iconId: 'no_terminator',
                    index: 2,
                },
                {
                    name: 'No Big Target',
                    points: 25,
                    units: filter(noTyranids).byTrait(Trait.BigTarget, true),
                    selected: true,
                    iconId: 'no_bigTarget',
                    index: 3,
                },
                {
                    name: 'Mechanical',
                    points: 120,
                    units: filter(noTyranids).isMechanical(),
                    iconId: 'mech',
                    index: 4,
                },
            ],
            staticData.beta
        );
    }

    protected getGammaTrack(unitsData: Array<ICharacter2>): ILegendaryEventTrack {
        const noThousandSons = filter(unitsData).byFaction(Faction.Thousand_Sons, true);
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
                    iconId: 'no_mech',
                    index: 0,
                },
                {
                    name: 'Physical',
                    points: 95,
                    units: filter(noThousandSons).byDamageType(DamageType.Physical),
                    selected: true,
                    iconId: 'physical',
                    index: 1,
                },
                {
                    name: 'Piercing',
                    points: 105,
                    units: filter(noThousandSons).byDamageType(DamageType.Piercing),
                    iconId: 'piercing',
                    index: 2,
                },
                {
                    name: 'Min 5 hits',
                    points: 115,
                    units: filter(noThousandSons).byMinHits(5),
                    iconId: 'hits',
                    index: 3,
                },
                {
                    name: 'No Flying',
                    points: 30,
                    units: filter(noThousandSons).byTrait(Trait.Flying, true),
                    selected: true,
                    iconId: 'no_flying',
                    index: 4,
                },
            ],
            staticData.gamma
        );
    }
}
