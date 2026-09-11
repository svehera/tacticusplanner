import { describe, expect, it } from 'vitest';

import { Rarity, RarityStars } from '@/fsd/5-shared/model';

import {
    calculateRosterCharacterPower,
    calculateRosterMowPower,
    RosterMowPowerInput,
    RosterPowerInput,
} from './character-power';
import { bundledPowerConfig, PowerConfig } from './character-power.data';
import { progressionIndexFromRarityStars } from './progression-index';

const config = (unitOverrides: Record<string, unknown> = {}): PowerConfig => ({
    units: {
        lineup: {
            testUnit: {
                name: 'Test Unit',
                traits: [],
                weapons: [{ hits: 1, DamageProfile: 'Bolter' }],
                activeAbilities: ['activeA'],
                passiveAbilities: ['passiveA'],
                Movement: 16,
                stats: { Health: 100, Damage: 10 },
                upgrades: [],
                upgradesStatIncrease: [],
                ...unitOverrides,
            },
        },
        heroProgressionSteps: [{ unitStatMultiplierPct: 100, abilityPowerMultiplier: 100 }],
        heroProgressionStepsPerUnit: {},
        damageProfileModifiers: { Bolter: 100 },
        abilityPowerCurve: { active: [10, 20], passive: [5, 15], relic: [1000, 2000, 3000] },
        abilityPowerModifiers: {},
        traitPowerModifiers: {},
    },
    items: {
        relicItem: { abilityId: 'someRelicAbility', levels: [{ stats: {} }, { stats: {} }, { stats: {} }] },
    },
    upgrades: {},
});

const input = (overrides: Partial<RosterPowerInput> = {}): RosterPowerInput => ({
    unitId: 'testUnit',
    progressionIndex: 0,
    rank: 0,
    activeLevel: 2,
    passiveLevel: 2,
    appliedUpgradeIndices: [],
    equipment: [],
    ...overrides,
});

describe('calculateRosterCharacterPower', () => {
    it('reproduces the reference implementation output for a hand-built fixture', () => {
        expect(calculateRosterCharacterPower(input(), config())).toBe(3514);
    });

    it('gives a higher-rank character more power than an otherwise-identical lower-rank one', () => {
        const rankedConfig = config({ upgrades: [['hpUpgrade']], upgradesStatIncrease: [[50]] });
        const withUpgrades: PowerConfig = { ...rankedConfig, upgrades: { hpUpgrade: { statType: 'hp' } } };

        const low = calculateRosterCharacterPower(input({ rank: 0 }), withUpgrades);
        const high = calculateRosterCharacterPower(input({ rank: 1 }), withUpgrades);

        expect(high).toBeGreaterThan(low);
    });

    it('returns 0 for a locked character (negative game rank)', () => {
        expect(calculateRosterCharacterPower(input({ rank: -1 }), config())).toBe(0);
    });

    it('adds relic ability power for an equipped relic', () => {
        const withoutRelic = calculateRosterCharacterPower(input(), config());
        const withRelic = calculateRosterCharacterPower(
            input({ equipment: [{ itemId: 'relicItem', level: 2 }] }),
            config()
        );
        expect(withRelic).toBeGreaterThan(withoutRelic);
    });

    it('throws when the unit is missing from the bundled config', () => {
        expect(() => calculateRosterCharacterPower(input({ unitId: 'unknownUnit' }), config())).toThrow(/unknownUnit/);
    });

    it('applies sqrt(0.9), not a bare 0.9, as the range modifier for a weapon with no Range', () => {
        // A regression guard for a bug where a melee (no-`Range`) weapon's power was multiplied by
        // a flat 0.9 instead of sqrt(0.9) — a ~5% undercount that only shows up for weapons without
        // a Range, and is invisible in ability-power-dominated fixtures like the one above.
        const bigStatsConfig = config({ stats: { Health: 100_000, Damage: 10_000 } });
        const noAbilityInput = input({ activeLevel: 0, passiveLevel: 0 });

        const actual = calculateRosterCharacterPower(noAbilityInput, bigStatsConfig);

        const durability = 100_000;
        const weaponPower = 10_000 * Math.sqrt(0.9);
        const statsPower = Math.pow(durability * weaponPower, 2 / 3);
        const expected = Math.round(10 + (statsPower * Math.sqrt(16)) / 100);

        expect(actual).toBe(expected);
    });

    it('reproduces real, in-game-verified power for two equipped characters (Kharn and Gulgortz)', () => {
        // Values confirmed against the live game for these exact roster records. Kharn's single
        // weapon has no `Range` (100% of its weapon power went through the buggy range-modifier
        // path above); Gulgortz has one melee + one ranged weapon, diluting that same bug's effect.
        const kharn = calculateRosterCharacterPower(
            {
                unitId: 'worldKharn',
                progressionIndex: 18,
                rank: 19,
                activeLevel: 60,
                passiveLevel: 60,
                appliedUpgradeIndices: [],
                equipment: [
                    { itemId: 'I_Crit_M006', level: 1 },
                    { itemId: 'I_Booster_Crit_M003', level: 1 },
                    { itemId: 'I_Block_M003', level: 1 },
                ],
            },
            bundledPowerConfig
        );
        const gulgortz = calculateRosterCharacterPower(
            {
                unitId: 'orksWarboss',
                progressionIndex: 16,
                rank: 19,
                activeLevel: 60,
                passiveLevel: 60,
                appliedUpgradeIndices: [],
                equipment: [
                    { itemId: 'R_Crit_HeadwoppasKillchoppa', level: 6 },
                    { itemId: 'I_Block_L003', level: 11 },
                    { itemId: 'I_Booster_Block_M002', level: 1 },
                ],
            },
            bundledPowerConfig
        );

        expect(kharn).toBe(936_827);
        expect(gulgortz).toBe(954_786);
    });
});

const mowConfig = (): PowerConfig => ({
    units: {
        lineup: {
            testMachine: {
                name: 'Test Machine',
                traits: ['MachineOfWar'],
                activeAbilities: ['primaryA', 'secondaryA'],
            },
        },
        heroProgressionStepsMoW: [
            { abilityPowerMultiplier: 2 },
            { abilityPowerMultiplier: 3, mythicAbilityPower: 5000 },
        ],
        abilityPowerCurve: { active: [10, 20], passive: [5, 15] },
        abilityPowerModifiers: {},
        traitPowerModifiers: { MachineOfWar: 100 },
    },
    items: {},
    upgrades: {},
});

const mowInput = (overrides: Partial<RosterMowPowerInput> = {}): RosterMowPowerInput => ({
    unitId: 'testMachine',
    progressionIndex: 0,
    primaryAbilityLevel: 2,
    secondaryAbilityLevel: 2,
    ...overrides,
});

describe('calculateRosterMowPower', () => {
    it('reproduces the reference implementation output for a maxed Biovore', () => {
        // Documented in the reference characterPower.mjs README as the known-good value for this
        // exact input against a matching GameConfig snapshot.
        const power = calculateRosterMowPower(
            {
                unitId: 'tyranBiovore',
                progressionIndex: 19,
                primaryAbilityLevel: 60,
                secondaryAbilityLevel: 60,
            },
            bundledPowerConfig
        );
        expect(power).toBe(1_040_687);
    });

    it('adds the flat mythic-ability bonus once the progression step unlocks one', () => {
        const withoutMythic = calculateRosterMowPower(mowInput({ progressionIndex: 0 }), mowConfig());
        const withMythic = calculateRosterMowPower(mowInput({ progressionIndex: 1 }), mowConfig());
        expect(withMythic).toBeGreaterThan(withoutMythic);
    });

    it('throws when the MoW is missing from the bundled config', () => {
        expect(() => calculateRosterMowPower(mowInput({ unitId: 'unknownMachine' }), mowConfig())).toThrow(
            /unknownMachine/
        );
    });
});

describe('progressionIndexFromRarityStars', () => {
    it('inverts the known progression-index table', () => {
        expect(progressionIndexFromRarityStars(Rarity.Common, RarityStars.None)).toBe(0);
        expect(progressionIndexFromRarityStars(Rarity.Uncommon, RarityStars.TwoStars)).toBe(3);
        expect(progressionIndexFromRarityStars(Rarity.Rare, RarityStars.FourStars)).toBe(6);
        expect(progressionIndexFromRarityStars(Rarity.Epic, RarityStars.RedOneStar)).toBe(9);
        expect(progressionIndexFromRarityStars(Rarity.Legendary, RarityStars.RedThreeStars)).toBe(12);
        expect(progressionIndexFromRarityStars(Rarity.Mythic, RarityStars.OneBlueStar)).toBe(16);
        expect(progressionIndexFromRarityStars(Rarity.Mythic, RarityStars.MythicWings)).toBe(19);
    });

    it('clamps out-of-range combinations', () => {
        expect(progressionIndexFromRarityStars(Rarity.Mythic, RarityStars.ThreeBlueStars + 10)).toBe(19);
    });
});
