import { Alliance, DamageType, Trait, Faction } from '@/fsd/5-shared/model';

import { ICharacter2 } from '@/fsd/4-entities/character';
import { patermine as staticData } from '@/fsd/4-entities/lre';

import { ILegendaryEventTrack } from '../lre.model';

import { LegendaryEventBase } from './base.le';
import { LETrack } from './base.le.track';
import { filter } from './filters';

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
                    iconId: 'physical',
                    index: 0,
                },
                {
                    name: 'Melee only',
                    points: 65,
                    units: filter(noOrks).byAttackType('meleeOnly'),
                    selected: true,
                    iconId: 'melee',
                    index: 1,
                },
                {
                    name: 'Max 4 hits',
                    points: 30,
                    units: filter(noOrks).byMaxHits(4),
                    selected: true,
                    iconId: 'hits',
                    index: 2,
                },
                {
                    name: 'Mechanical',
                    points: 85,
                    units: filter(noOrks).isMechanical(),
                    iconId: 'mech',
                    index: 3,
                },
                {
                    name: 'Bolter',
                    points: 100,
                    units: filter(noOrks).byDamageType(DamageType.Bolter),
                    selected: false,
                    iconId: 'bolter',
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
                    name: 'Power',
                    points: 95,
                    units: filter(noImperial).byDamageType(DamageType.Power),
                    selected: false,
                    iconId: 'power',
                    index: 0,
                },
                {
                    name: 'Flying',
                    points: 95,
                    units: filter(noImperial).byTrait(Trait.Flying),
                    iconId: 'flying',
                    index: 1,
                },
                {
                    name: 'No Summons',
                    points: 45,
                    units: filter(noImperial).byNoSummons(),
                    selected: true,
                    iconId: 'no_summons',
                    index: 2,
                },
                {
                    name: 'Melee only',
                    points: 70,
                    units: filter(noImperial).byAttackType('meleeOnly'),
                    selected: true,
                    iconId: 'melee',
                    index: 3,
                },
                {
                    name: 'Max 2 hits',
                    points: 70,
                    units: filter(noImperial).byMaxHits(2),
                    selected: false,
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
                    name: 'Piercing',
                    points: 110,
                    units: filter(noChaos).byDamageType(DamageType.Piercing),
                    selected: false,
                    iconId: 'piercing',
                    index: 0,
                },
                {
                    name: 'No Overwatch',
                    points: 30,
                    units: filter(noChaos).byTrait(Trait.Overwatch, true),
                    selected: true,
                    iconId: 'no_overwatch',
                    index: 1,
                },
                {
                    name: 'No Final Vengeance',
                    points: 40,
                    units: filter(noChaos).byTrait(Trait.FinalVengeance, true),
                    selected: true,
                    iconId: 'no_finalVengeance',
                    index: 2,
                },
                {
                    name: 'Min 4 hits',
                    points: 100,
                    units: filter(noChaos).byMinHits(4),
                    selected: false,
                    iconId: 'hits',
                    index: 3,
                },
                {
                    name: 'Power',
                    points: 95,
                    units: filter(noChaos).byDamageType(DamageType.Power),
                    selected: false,
                    iconId: 'power',
                    index: 4,
                },
            ],
            staticData.gamma
        );
    }
}
