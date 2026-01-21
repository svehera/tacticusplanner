import { Alliance, DamageType, Trait } from '@/fsd/5-shared/model';

import { ICharacter2 } from '@/fsd/4-entities/character';
import { dante as staticData } from '@/fsd/4-entities/lre';

import { ILegendaryEventTrack } from '../lre.model';

import { LegendaryEventBase } from './base.le';
import { LETrack } from './base.le.track';
import { filter } from './filters';

export class DanteLegendaryEvent extends LegendaryEventBase {
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
                    name: 'Psyker',
                    points: 90,
                    objectiveType: 'Trait',
                    objectiveTarget: 'Psyker',
                    units: filter(noXenos).byTrait(Trait.Psyker),
                    iconId: 'psyker',
                    index: 0,
                },
                {
                    name: 'Power',
                    points: 65,
                    objectiveType: 'DamageType',
                    objectiveTarget: 'Power',
                    units: filter(noXenos).byDamageType(DamageType.Power),
                    iconId: 'power',
                    index: 1,
                },
                {
                    name: 'Max 1 Hit',
                    points: 50,
                    objectiveType: 'MaxHits',
                    objectiveTarget: '1',
                    units: filter(noXenos).byMaxHits(1),
                    iconId: 'hits',
                    index: 2,
                },
                {
                    name: 'Rapid Assault',
                    points: 90,
                    objectiveType: 'Trait',
                    objectiveTarget: 'RapidAssault',
                    units: filter(noXenos).byTrait(Trait.RapidAssault),
                    iconId: 'rapid assault',
                    index: 3,
                },
                {
                    name: 'Physical',
                    points: 80,
                    objectiveType: 'DamageType',
                    objectiveTarget: 'Physical',
                    units: filter(noXenos).byDamageType(DamageType.Physical),
                    iconId: 'physical',
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
                    name: 'No Power',
                    points: 75,
                    objectiveType: 'NotDamageType',
                    objectiveTarget: 'Power',
                    units: filter(noChaos).byDamageType(DamageType.Power, true),
                    iconId: 'no_power',
                    index: 0,
                },
                {
                    name: 'Get Stuck In',
                    points: 90,
                    objectiveType: 'Trait',
                    objectiveTarget: 'GetStuckIn',
                    units: filter(noChaos).byTrait(Trait.GetStuckIn),
                    iconId: 'get stuck in',
                    index: 1,
                },
                {
                    name: 'Deep Strike',
                    points: 75,
                    objectiveType: 'Trait',
                    objectiveTarget: 'TeleportStrike',
                    units: filter(noChaos).byTrait(Trait.TeleportStrike),
                    iconId: 'deep strike',
                    index: 2,
                },
                {
                    name: 'Chain',
                    points: 90,
                    objectiveType: 'DamageType',
                    objectiveTarget: 'Chain',
                    units: filter(noChaos).byDamageType(DamageType.Chain),
                    iconId: 'chain',
                    index: 3,
                },
                {
                    name: 'Max 3 hits',
                    points: 45,
                    objectiveType: 'MaxHits',
                    objectiveTarget: '3',
                    units: filter(noChaos).byMaxHits(3),
                    iconId: 'hits',
                    index: 4,
                },
            ],
            staticData.beta
        );
    }

    protected getGammaTrack(unitsData: Array<ICharacter2>): ILegendaryEventTrack {
        const noImperial = filter(unitsData).byAlliance(Alliance.Imperial, true);
        return new LETrack(
            this.id,
            'gamma',
            noImperial,
            [
                {
                    name: 'Flame',
                    points: 90,
                    objectiveType: 'DamageType',
                    objectiveTarget: 'Flame',
                    units: filter(noImperial).byDamageType(DamageType.Flame),
                    iconId: 'flame',
                    index: 0,
                },
                {
                    name: 'No Power',
                    points: 50,
                    objectiveType: 'NotDamageType',
                    objectiveTarget: 'Power',
                    units: filter(noImperial).byDamageType(DamageType.Power, true),
                    iconId: 'no_power',
                    index: 1,
                },
                {
                    name: 'Terminator',
                    points: 65,
                    objectiveType: 'Trait',
                    objectiveTarget: 'TerminatorArmour',
                    units: filter(noImperial).byTrait(Trait.TerminatorArmour),
                    iconId: 'terminator',
                    index: 2,
                },
                {
                    name: 'Min 4 hits',
                    points: 75,
                    objectiveType: 'MinHits',
                    objectiveTarget: '4',
                    units: filter(noImperial).byMinHits(4),
                    selected: false,
                    iconId: 'hits',
                    index: 3,
                },
                {
                    name: 'Physical',
                    points: 95,
                    objectiveType: 'DamageType',
                    objectiveTarget: 'Physical',
                    units: filter(noImperial).byDamageType(DamageType.Physical),
                    selected: false,
                    iconId: 'physical',
                    index: 4,
                },
            ],
            staticData.gamma
        );
    }
}
