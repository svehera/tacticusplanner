import { Alliance, Trait, DamageType, Faction } from '@/fsd/5-shared/model';

import { ICharacter2 } from '@/fsd/4-entities/character';
import { lucius as staticData } from '@/fsd/4-entities/lre';

import { ILegendaryEventTrack } from '../lre.model';

import { LegendaryEventBase } from './base.le';
import { LETrack } from './base.le.track';
import { filter } from './filters';

export class LuciusLegendaryEvent extends LegendaryEventBase {
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
                    name: 'Black Legion',
                    points: 90,
                    units: filter(noXenos).byFaction(Faction.Black_Legion),
                    iconId: 'black_legion',
                    index: 0,
                },
                {
                    name: 'Bolter',
                    points: 95,
                    units: filter(noXenos).byDamageType(DamageType.Bolter),
                    iconId: 'bolter',
                    index: 1,
                },
                {
                    name: 'Min 4 Hits',
                    points: 45,
                    units: filter(noXenos).byMinHits(4),
                    iconId: 'hits',
                    index: 2,
                },
                {
                    name: 'Flying',
                    points: 90,
                    units: filter(noXenos).byTrait(Trait.Flying),
                    iconId: 'flying',
                    index: 3,
                },
                {
                    name: 'No Bolter',
                    points: 60,
                    units: filter(noXenos).byDamageType(DamageType.Bolter, true),
                    iconId: 'piercing',
                    index: 4,
                },
            ],
            staticData.alpha
        );
    }

    protected getBetaTrack(unitsData: Array<ICharacter2>): ILegendaryEventTrack {
        const noChaos = filter(unitsData).byAlliance(Alliance.Chaos, true);
        const noChaosOrTyranids = filter(noChaos).byFaction(Faction.Tyranids, true);

        return new LETrack(
            this.id,
            'beta',
            noChaosOrTyranids,
            [
                {
                    name: 'Heavy Weapon',
                    points: 95,
                    units: filter(noChaosOrTyranids).byTrait(Trait.HeavyWeapon),
                    iconId: 'heavy_weapon',
                    index: 0,
                },
                {
                    name: 'Piercing',
                    points: 65,
                    units: filter(noChaosOrTyranids).byDamageType(DamageType.Piercing),
                    iconId: 'piercing',
                    index: 1,
                },
                {
                    name: 'Unstoppable',
                    points: 95,
                    units: filter(noChaosOrTyranids).byTrait(Trait.Unstoppable),
                    iconId: 'unstoppable',
                    index: 2,
                },
                {
                    name: 'Physical',
                    points: 45,
                    units: filter(noChaosOrTyranids).byDamageType(DamageType.Physical),
                    iconId: 'physical',
                    index: 3,
                },
                {
                    name: 'Max 2 hits',
                    points: 75,
                    units: filter(noChaosOrTyranids).byMaxHits(2),
                    iconId: 'hits',
                    index: 4,
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
                    name: 'Close Combat Weakness',
                    points: 105,
                    units: filter(noImperials).byTrait(Trait.CloseCombatWeakness),
                    iconId: 'close_combat_weakness',
                    index: 0,
                },
                {
                    name: 'Psychic',
                    points: 80,
                    units: filter(noImperials).byDamageType(DamageType.Psychic),
                    iconId: 'psychic',
                    index: 1,
                },
                {
                    name: 'No Power',
                    points: 35,
                    units: filter(noImperials).byDamageType(DamageType.Power, true),
                    iconId: 'no_power',
                    index: 2,
                },
                {
                    name: 'Min 5 hits',
                    points: 95,
                    units: filter(noImperials).byMinHits(5),
                    iconId: 'hits',
                    index: 3,
                },
                {
                    name: 'Physical',
                    points: 60,
                    units: filter(noImperials).byDamageType(DamageType.Physical),
                    iconId: 'physical',
                    index: 4,
                },
            ],
            staticData.gamma
        );
    }
}
