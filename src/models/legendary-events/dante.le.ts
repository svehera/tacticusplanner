import { ICharacter2, ILegendaryEventTrack } from '../interfaces';
import { Alliance, DamageType, Faction, Trait } from '../enums';
import { filter } from './filters';
import { LegendaryEventBase } from './base.le';
import { LETrack } from './base.le.track';

import staticData from '../../assets/legendary-events/Dante.json';

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
                    units: filter(noXenos).byTrait(Trait.Psyker),
                    iconId: 'psyker',
                    index: 0,
                },
                {
                    name: 'Power',
                    points: 65,
                    units: filter(noXenos).byDamageType(DamageType.Power),
                    iconId: 'power',
                    index: 1,
                },
                {
                    name: 'Max 1 Hit',
                    points: 50,
                    units: filter(noXenos).byMaxHits(1),
                    iconId: 'hits',
                    index: 2,
                },
                {
                    name: 'Rapid Assault',
                    points: 90,
                    units: filter(noXenos).byTrait(Trait.RapidAssault),
                    iconId: 'rapid assault',
                    index: 3,
                },
                {
                    name: 'Physical',
                    points: 80,
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
                    units: filter(noChaos).byDamageType(DamageType.Power, true),
                    iconId: 'no_power',
                    index: 0,
                },
                {
                    name: 'Get Stuck In',
                    points: 90,
                    units: filter(noChaos).byTrait(Trait.GetStuckIn),
                    iconId: 'get stuck in',
                    index: 1,
                },
                {
                    name: 'Deep Strike',
                    points: 75,
                    units: filter(noChaos).byTrait(Trait.DeepStrike),
                    iconId: 'deep strike',
                    index: 2,
                },
                {
                    name: 'Chain',
                    points: 90,
                    units: filter(noChaos).byDamageType(DamageType.Chain),
                    iconId: 'chain',
                    index: 3,
                },
                {
                    name: 'Max 3 hits',
                    points: 45,
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
                    units: filter(noImperial).byDamageType(DamageType.Flame),
                    iconId: 'flame',
                    index: 0,
                },
                {
                    name: 'No Power',
                    points: 50,
                    units: filter(noImperial).byDamageType(DamageType.Power, true),
                    iconId: 'no_power',
                    index: 1,
                },
                {
                    name: 'Terminator',
                    points: 65,
                    units: filter(noImperial).byTrait(Trait.TerminatorArmour),
                    iconId: 'terminator',
                    index: 2,
                },
                {
                    name: 'Min 4 hits',
                    points: 75,
                    units: filter(noImperial).byMinHits(4),
                    selected: false,
                    iconId: 'hits',
                    index: 3,
                },
                {
                    name: 'Physical',
                    points: 95,
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
