import { Alliance, DamageType, Trait } from '@/fsd/5-shared/model';

import { ICharacter2 } from '@/fsd/4-entities/character';
import { vitruvius as staticData } from '@/fsd/4-entities/lre';

import { ILegendaryEventTrack } from '../lre.model';

import { LegendaryEventBase } from './base.le';
import { LETrack } from './base.le.track';
import { filter } from './filters';

export class VitruviusLegendaryEvent extends LegendaryEventBase {
    constructor(unitsData: Array<ICharacter2>) {
        super(unitsData, staticData);
    }

    protected getAlphaTrack(unitsData: Array<ICharacter2>): ILegendaryEventTrack {
        const noNecrons = filter(unitsData).byFaction('Necrons', true);
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
                    iconId: 'no_psychic',
                },
                {
                    name: 'Ranged',
                    points: 75,
                    units: filter(noNecrons).byAttackType('rangeOnly'),
                    selected: true,
                    iconId: 'ranged',
                },
                {
                    name: 'Max 1 hit',
                    points: 120,
                    units: filter(noNecrons).byMaxHits(1),
                    iconId: 'hits',
                },
                {
                    name: 'Power',
                    points: 105,
                    units: filter(noNecrons).byDamageType(DamageType.Power),
                    iconId: 'power',
                },
                {
                    name: 'No Resilient',
                    points: 35,
                    units: filter(noNecrons).byTrait(Trait.Resilient, true),
                    selected: true,
                    iconId: 'no_resilient',
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
                    iconId: 'hits',
                },
                {
                    name: 'Piercing',
                    points: 115,
                    units: filter(noChaos).byDamageType(DamageType.Piercing),
                    iconId: 'piercing',
                },
                {
                    name: 'Bolter',
                    points: 105,
                    units: filter(noChaos).byDamageType(DamageType.Bolter),
                    iconId: 'bolter',
                },
                {
                    name: 'No Infiltrate',
                    points: 30,
                    units: filter(noChaos).byTrait(Trait.Infiltrate, true),
                    selected: true,
                    iconId: 'no_infiltrate',
                },
                {
                    name: 'No Summons',
                    points: 50,
                    units: filter(noChaos).byNoSummons(),
                    selected: true,
                    iconId: 'no_summons',
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
                    iconId: 'no_flying',
                },
                {
                    name: 'No Death Guard',
                    points: 35,
                    units: filter(noImperials).byFaction('DeathGuard', true),
                    selected: true,
                    iconId: 'no_death_guard',
                },
                {
                    name: 'Power',
                    points: 125,
                    units: filter(noImperials).byDamageType(DamageType.Power),
                    iconId: 'power',
                },
                {
                    name: 'No Psykers',
                    points: 45,
                    units: filter(noImperials).byTrait(Trait.Psyker, true),
                    selected: true,
                    iconId: 'no_psychic',
                },
                {
                    name: 'Max 2 hits',
                    points: 110,
                    units: filter(noImperials).byMaxHits(2),
                    iconId: 'hits',
                },
            ],
            staticData.gamma
        );
    }
}
