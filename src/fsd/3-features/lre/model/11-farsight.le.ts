import { Alliance, Trait, DamageType, Faction } from '@/fsd/5-shared/model';

import { ICharacter2 } from '@/fsd/4-entities/character';
import { farsight as staticData } from '@/fsd/4-entities/lre';

import { ILegendaryEventTrack } from '../lre.model';

import { LegendaryEventBase } from './base.le';
import { LETrack } from './base.le.track';
import { filter } from './filters';

export class FarsightLegendaryEvent extends LegendaryEventBase {
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
                    name: 'No Terminator',
                    points: 1,
                    units: filter(noImperial).byTrait(Trait.TerminatorArmour, /*not=*/ true),
                    iconId: 'no_terminator',
                    index: 0,
                },
                {
                    name: 'Power',
                    points: 1,
                    units: filter(noImperial).byDamageType(DamageType.Power),
                    iconId: 'power',
                    index: 1,
                },
                {
                    name: 'Min 5 Hits',
                    points: 1,
                    units: filter(noImperial).byMinHits(5),
                    iconId: 'hits',
                    index: 2,
                },
                {
                    name: 'Flame',
                    points: 1,
                    units: filter(noImperial).byDamageType(DamageType.Flame),
                    iconId: 'flame',
                    index: 3,
                },
                {
                    name: 'Eviscerate',
                    points: 1,
                    units: filter(noImperial).byDamageType(DamageType.Eviscerate),
                    iconId: 'eviscerate',
                    index: 4,
                },
            ],
            staticData.alpha
        );
    }

    protected getBetaTrack(unitsData: Array<ICharacter2>): ILegendaryEventTrack {
        const noXenos = filter(unitsData).byAlliance(Alliance.Xenos, true);

        return new LETrack(
            this.id,
            'beta',
            noXenos,
            [
                {
                    name: 'Astra Militarum',
                    points: 1,
                    units: filter(noXenos).byFaction(Faction.Astra_militarum),
                    iconId: 'astra_militarum',
                    index: 0,
                },
                {
                    name: 'Bolter',
                    points: 1,
                    units: filter(noXenos).byDamageType(DamageType.Bolter),
                    iconId: 'bolter',
                    index: 1,
                },
                {
                    name: 'Resilient',
                    points: 1,
                    units: filter(noXenos).byTrait(Trait.Resilient),
                    iconId: 'resilient',
                    index: 2,
                },
                {
                    name: 'Piercing',
                    points: 1,
                    units: filter(noXenos).byDamageType(DamageType.Piercing),
                    iconId: 'piercing',
                    index: 3,
                },
                {
                    name: 'Max 2 hits',
                    points: 1,
                    units: filter(noXenos).byMaxHits(2),
                    iconId: 'hits',
                    index: 4,
                },
            ],
            staticData.beta
        );
    }

    protected getGammaTrack(unitsData: Array<ICharacter2>): ILegendaryEventTrack {
        const noChaos = filter(unitsData).byAlliance(Alliance.Chaos, true);
        const noChaosOrOrks = filter(noChaos).byFaction(Faction.Orks, true);
        return new LETrack(
            this.id,
            'gamma',
            noChaosOrOrks,
            [
                {
                    name: 'No Physical',
                    points: 1,
                    units: filter(noChaosOrOrks).byDamageType(DamageType.Physical, true),
                    iconId: 'no_physical',
                    index: 0,
                },
                {
                    name: 'Blast',
                    points: 1,
                    units: filter(noChaosOrOrks).byDamageType(DamageType.Blast),
                    iconId: 'blast',
                    index: 1,
                },
                {
                    name: 'Ranged',
                    points: 1,
                    units: filter(noChaosOrOrks).byAttackType('rangeOnly'),
                    iconId: 'ranged',
                    index: 2,
                },
                {
                    name: 'Max 1 hit',
                    points: 1,
                    units: filter(noChaosOrOrks).byMaxHits(1),
                    iconId: 'hits',
                    index: 3,
                },
                {
                    name: 'Flying',
                    points: 1,
                    units: filter(noChaosOrOrks).byTrait(Trait.Flying),
                    iconId: 'flying',
                    index: 4,
                },
            ],
            staticData.gamma
        );
    }
}
