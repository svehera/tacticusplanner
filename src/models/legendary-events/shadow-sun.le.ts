import { ICharacter, ILegendaryEventTrack, ITableRow } from '../interfaces';
import { Alliance, DamageType, Faction, Trait,  LegendaryEvent } from '../enums';
import { filter } from './filters';
import { LegendaryEventBase } from './base.le';
import { LETrack } from './base.le.track';

const regularMissions: string[] = [
    'Play one Philosophy of War Battle, Deal 1000 damage',
    'Defeat 30 Necrons',
    'Defeat 75 Tyranids',
    'Defeat 100 Ultramarines',
    'Use abilities 15 times with Xenos units, Deal 10k damage with Abilities',
    'Use abilities 20 times with Imperial units, Deal 15k damage with Abilities',
    'Use abilities 25 times with Chaos units, Deal 20k damage with Abilities',
    'Play 3 Philosophy of War Battles, Deal 25k Bolter damage',
    'Play 3 Philosophy of War Battles, Deal 25k Psychic damage',
    'Play 3 Philosophy of War Battles, Deal 25k Power damage'
];

const premiumMissions: string[] = [
    'Win 1 battle without Summoning any units',
    'Defeat 30 enemies with Xenos units',
    'Defeat 75 enemies with Imperial units',
    'Defeat 100 enemies with Chaos units',
    'Win 5 battles without deploying any Resilient characters',
    'Win 5 battles without deploying any Overwatch characters',
    'Win 5 battles without deploying any Living Metal characters',
    'Defeat 75 enemies with Bolter Damage',
    'Defeat 75 enemies with Psychic Damage',
    'Defeat 75 enemies with Power Damage'
];

const battlePoints: [number[], number[], number[]] = [
    [29, 39, 33, 48, 36, 52, 45, 39, 54, 50, 50, 60],
    [34, 40, 57, 59, 49, 58, 55, 50, 54, 58, 59, 61],
    [31, 36, 56, 48, 53, 61, 67, 50, 57, 60, 67, 54]  
];

export class ShadowSunLegendaryEvent extends LegendaryEventBase {

    constructor(unitsData: Array<ICharacter>) {
        super(LegendaryEvent.Shadowsun, 'Shadowsun', unitsData, regularMissions, premiumMissions, battlePoints);
    }

    protected getAlphaTrack(unitsData: Array<ICharacter>): ILegendaryEventTrack {
        const noNecrons = filter(unitsData).byFaction(Faction.Necrons, true);
        return new LETrack(
            this.id,
            'alpha',
            'Alpha (No Necrons)',
            18,
            noNecrons,
            [
                {
                    name: 'Big Target',
                    points: 115,
                    units: filter(noNecrons).byTrait(Trait.BigTarget),
                },
                {
                    name: 'No Psykers',
                    points: 40,
                    units: filter(noNecrons).byTrait(Trait.Psyker, true),
                    core: true
                },
                {
                    name: 'Min 4 hits',
                    points: 80,
                    units: filter(noNecrons).byMinHits(4),
                    core: true
                },
                {
                    name: 'Power',
                    points: 80,
                    units: filter(noNecrons).byDamageType(DamageType.Power),
                },
                {
                    name: 'No Range',
                    points: 60,
                    units: filter(noNecrons).byAttackType('meleeOnly'),
                    core: true
                },
            ],
        );
    }

    protected getBetaTrack(unitsData: Array<ICharacter>): ILegendaryEventTrack {
        const noTyranids = filter(unitsData).byFaction(Faction.Tyranids, true);
        return new LETrack(
            this.id,
            'beta',
            'Beta (No Tyranids)',
            19,
            noTyranids,
            [
                {
                    name: 'Mechanical',
                    points: 90,
                    units: filter(noTyranids).isMechanical(),
                },
                {
                    name: 'ASTRA MILITARUM',
                    points: 120,
                    units: filter(noTyranids).byFaction(Faction.Astra_militarum),
                },
                {
                    name: 'No Bolter',
                    points: 50,
                    units: filter(noTyranids).byDamageType(DamageType.Bolter, true),
                    core: true
                },
                {
                    name: 'No Piercing',
                    points: 50,
                    units:  filter(noTyranids).byDamageType(DamageType.Piercing, true),
                    core: true
                },
                {
                    name: 'No Summons',
                    points: 65,
                    units: filter(noTyranids).byNoSummons(),
                    core: true
                },
            ]
        );
    }

    protected getGammaTrack(unitsData: Array<ICharacter>): ILegendaryEventTrack {
        const noImperials = filter(unitsData).byAlliance(Alliance.Imperial, true);
        return new LETrack(
            this.id,
            'gamma',
            'Gamma (No Imperials)',
            35,
            noImperials,
            [
                {
                    name: 'No Piercing',
                    points: 40,
                    units: filter(noImperials).byDamageType(DamageType.Piercing, true),
                    core: true
                },
                {
                    name: 'Ranged',
                    points: 65,
                    units: filter(noImperials).byAttackType('rangeOnly'),
                    core: true
                },
                {
                    name: 'Min 3 hits',
                    points: 50,
                    units: filter(noImperials).byMinHits(3),
                    core: true
                },
                {
                    name: 'Power',
                    points: 100,
                    units:  filter(noImperials).byDamageType(DamageType.Power),
                },
                {
                    name: 'Black Legion',
                    points: 120,
                    units:  filter(noImperials).byFaction(Faction.Black_Legion),
                },
            ]
        );
    }

}