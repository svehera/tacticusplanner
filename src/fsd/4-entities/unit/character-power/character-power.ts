// Ported from tacops' `src/characters/character-power.ts` / the original `characterPower.mjs`, just
// fed from the app's roster model instead of a raw CONNECT response. The validation is a feature:
// it throws loudly when the bundled GameConfig slice doesn't know a unit/item/upgrade the roster
// references (e.g. a character released after the last extraction) rather than returning a
// believable-but-wrong number.

import { bundledPowerConfig, PowerConfig } from './character-power.data';

/** One roster character reduced to exactly what the power formula reads. */
export interface RosterPowerInput {
    /** Snowprint id; must equal a key of `GameConfig.units.lineup`. */
    unitId: string;
    /** 0..19 — see `progressionIndexFromRarityStars`. */
    progressionIndex: number;
    /** 0-based game rank (app `Rank` enum value minus 1). */
    rank: number;
    activeLevel: number;
    passiveLevel: number;
    /** Indices into `lineup[unitId].upgrades[rank]` of the current-rank upgrades already applied. */
    appliedUpgradeIndices: number[];
    equipment: Array<{ itemId: string; level: number }>;
}

/** One roster Machine of War reduced to exactly what the power formula reads. MoWs have no rank,
 * upgrades, or equipment — only ability levels and progression (rarity/stars). */
export interface RosterMowPowerInput {
    /** Snowprint id; must equal a key of `GameConfig.units.lineup`. */
    unitId: string;
    /** 0..19 — see `progressionIndexFromRarityStars`. */
    progressionIndex: number;
    primaryAbilityLevel: number;
    secondaryAbilityLevel: number;
}

interface Stats {
    health: number;
    damage: number;
    fixedArmor: number;
    critChance: number;
    critDamage: number;
    blockChance: number;
    blockDamage: number;
    critChanceBonus: number;
    critDamageBonus: number;
    blockChanceBonus: number;
    blockDamageBonus: number;
}

type JsonObject = Record<string, unknown>;

/**
 * Real in-game power for a single roster character, matching the game's own formula (health,
 * damage, crit/block, ability power, trait/movement modifiers).
 *
 * Throws when `config` (the bundled GameConfig slice by default) is missing the unit, one of its
 * equipped items, or one of its upgrades — most often because `config` predates a freshly released
 * character.
 */
export function calculateRosterCharacterPower(
    input: RosterPowerInput,
    config: PowerConfig = bundledPowerConfig
): number {
    if (input.rank < 0) {
        return 0;
    }

    const unitsConfig = requireObject(config.units, 'GameConfig.units');
    const lineup = objectAt(unitsConfig, 'lineup');
    const itemConfigs = requireObject(config.items, 'GameConfig.items');
    const upgradeConfigs = requireObject(config.upgrades, 'GameConfig.upgrades');

    const unit = requireObject(lineup[input.unitId], `GameConfig.units.lineup.${input.unitId}`);
    const progressionStep = getProgressionStep(unitsConfig, input.unitId, input.progressionIndex);
    const stats = calculateStats(input, unit, progressionStep, itemConfigs, upgradeConfigs);
    const relicAbilityLevel = relicAbilityLevelOf(input.equipment, itemConfigs);
    return calculatePower(input, unit, progressionStep, stats, relicAbilityLevel, unitsConfig);
}

/**
 * Real in-game power for a single roster Machine of War: primary/secondary ability power plus a
 * flat mythic-ability bonus once its progression step unlocks one, scaled by trait and unit power
 * multipliers. MoWs have no health/damage/armor stats, so none of the character stat math applies.
 */
export function calculateRosterMowPower(input: RosterMowPowerInput, config: PowerConfig = bundledPowerConfig): number {
    const unitsConfig = requireObject(config.units, 'GameConfig.units');
    const lineup = objectAt(unitsConfig, 'lineup');
    const unit = requireObject(lineup[input.unitId], `GameConfig.units.lineup.${input.unitId}`);
    const progressionStep = getMachineProgressionStep(unitsConfig, input.unitId, input.progressionIndex);
    return calculateMachinePower(input, unit, progressionStep, unitsConfig);
}

/**
 * Level of the equipped relic (the one item whose config carries a non-empty `abilityId`), or 0
 * when no relic is equipped. Its power is added via the `abilityPowerCurve.relic` curve.
 */
function relicAbilityLevelOf(equipment: RosterPowerInput['equipment'], itemConfigs: JsonObject): number {
    let level = 0;
    for (const item of equipment) {
        const config = optionalObject(itemConfigs[item.itemId]);
        if (config && typeof config.abilityId === 'string' && config.abilityId.length > 0) {
            level = item.level;
        }
    }
    return level;
}

function calculateItemStats(equipment: RosterPowerInput['equipment'], itemConfigs: JsonObject): Stats {
    const result = emptyStats();
    for (const { itemId, level } of equipment) {
        const item = requireObject(itemConfigs[itemId], `GameConfig.items.${itemId}`);
        if (!Array.isArray(item.levels)) {
            throw new TypeError(`GameConfig item ${itemId} has no levels`);
        }
        const levelConfig = requireObject(item.levels[level - 1], `GameConfig.items.${itemId}.levels[${level - 1}]`);
        const rawStats = objectAt(levelConfig, 'stats');
        result.health += numberOrZero(rawStats.hp);
        result.damage += numberOrZero(rawStats.dmg);
        result.fixedArmor += numberOrZero(rawStats.fixedArmor);
        result.critChance = stackChance(result.critChance, numberOrZero(rawStats.critChance));
        result.critDamage += numberOrZero(rawStats.critDmg);
        result.blockChance = stackChance(result.blockChance, numberOrZero(rawStats.blockChance));
        result.blockDamage += numberOrZero(rawStats.blockDmg);
        result.critChanceBonus = stackChance(result.critChanceBonus, numberOrZero(rawStats.critChanceBonus));
        result.critDamageBonus += numberOrZero(rawStats.critDmgBonus);
        result.blockChanceBonus = stackChance(result.blockChanceBonus, numberOrZero(rawStats.blockChanceBonus));
        result.blockDamageBonus += numberOrZero(rawStats.blockDmgBonus);
    }
    if (result.critChance > 0) result.critChance += result.critChanceBonus;
    if (result.critDamage > 0) result.critDamage += result.critDamageBonus;
    if (result.blockChance > 0) result.blockChance += result.blockChanceBonus;
    if (result.blockDamage > 0) result.blockDamage += result.blockDamageBonus;
    return result;
}

function calculateStats(
    input: RosterPowerInput,
    unit: JsonObject,
    progressionStep: JsonObject,
    itemConfigs: JsonObject,
    upgradeConfigs: JsonObject
): Stats {
    const unitId = input.unitId;
    const base = objectAt(unit, 'stats');
    const stats = emptyStats();
    stats.health = numberOrZero(base.Health);
    stats.damage = numberOrZero(base.Damage);
    stats.fixedArmor = numberOrZero(base.FixedArmor);
    stats.critChance = numberOrZero(base.CritChance);
    stats.critDamage = numberOrZero(base.CritDamage);
    stats.blockChance = numberOrZero(base.BlockChance);
    stats.blockDamage = numberOrZero(base.BlockDamage);

    const rank = input.rank;
    const upgradeRows = nestedStringArrays(unit.upgrades, `${unitId}.upgrades`);
    const increaseRows = nestedNumberArrays(unit.upgradesStatIncrease, `${unitId}.upgradesStatIncrease`);
    for (let completedRank = 0; completedRank < rank; completedRank += 1) {
        addUpgradeRow(stats, upgradeRows[completedRank], increaseRows[completedRank], upgradeConfigs, unitId);
    }

    const multiplier = integerAt(progressionStep, 'unitStatMultiplierPct', `${unitId}.progressionStep`);
    stats.health = Math.trunc((stats.health * multiplier) / 100);
    stats.damage = Math.trunc((stats.damage * multiplier) / 100);
    stats.fixedArmor = Math.trunc((stats.fixedArmor * multiplier) / 100);

    for (const index of input.appliedUpgradeIndices) {
        const upgradeId = upgradeRows[rank]?.[index];
        const increase = increaseRows[rank]?.[index];
        if (upgradeId === undefined || increase === undefined) {
            throw new TypeError(`Invalid current-rank upgrade ${index} for ${unitId}`);
        }
        addUpgrade(stats, upgradeId, increase, upgradeConfigs, unitId);
    }

    mergeStats(stats, calculateItemStats(input.equipment, itemConfigs));
    return stats;
}

function calculatePower(
    input: RosterPowerInput,
    unit: JsonObject,
    progressionStep: JsonObject,
    stats: Stats,
    relicAbilityLevel: number,
    unitsConfig: JsonObject
): number {
    const damageModifiers = objectAt(unitsConfig, 'damageProfileModifiers');
    const weapons = arrayOfObjects(unit.weapons, 'unit.weapons');
    let squaredWeaponPower = 0;
    for (const weapon of weapons) {
        const hits = integerAt(weapon, 'hits', 'unit.weapon');
        const profile = stringAt(weapon, 'DamageProfile', 'unit.weapon');
        const baseDamage = hits * stats.damage;
        const criticalDamage = stats.critDamage * geometricPartial(stats.critChance / 100, hits);
        const profileModifier = numberAt(damageModifiers, profile, 'units.damageProfileModifiers');
        const rangeModifier = Math.sqrt(weapon.Range === undefined ? 0.9 : numberOrZero(weapon.Range));
        const weaponPower = (baseDamage + criticalDamage) * (profileModifier / 100) * rangeModifier;
        squaredWeaponPower += weaponPower * weaponPower;
    }
    const weaponsPower = Math.sqrt(squaredWeaponPower);

    const expectedBlock = 3 * stats.blockDamage * geometricPartial(stats.blockChance / 100, 3);
    const durability = (stats.health + expectedBlock) * (1 + stats.fixedArmor / 2);
    const statsPower = Math.pow(durability * weaponsPower, 2 / 3);

    const abilityPowerCurve = objectAt(unitsConfig, 'abilityPowerCurve');
    const activeCurve = numberArrayAt(abilityPowerCurve, 'active', 'units.abilityPowerCurve');
    const passiveCurve = numberArrayAt(abilityPowerCurve, 'passive', 'units.abilityPowerCurve');
    const relicCurve = numberArrayAt(abilityPowerCurve, 'relic', 'units.abilityPowerCurve');
    const abilityModifiers = objectAt(unitsConfig, 'abilityPowerModifiers');
    const activeId = stringArray(unit.activeAbilities, 'unit.activeAbilities')[0];
    const passiveId = stringArray(unit.passiveAbilities, 'unit.passiveAbilities')[0];
    if (!activeId || !passiveId) {
        throw new TypeError(`${input.unitId} must have one active and one passive ability`);
    }
    const activePower = abilityPower(activeId, input.activeLevel, activeCurve, abilityModifiers);
    const passivePower = abilityPower(passiveId, input.passiveLevel, passiveCurve, abilityModifiers);
    const abilityMultiplier = integerAt(progressionStep, 'abilityPowerMultiplier', 'unit.progressionStep');
    const abilitiesPower = (activePower + passivePower) * abilityMultiplier;

    let relicPower = 0;
    if (relicAbilityLevel >= 1) {
        const curveValue = relicCurve[relicAbilityLevel - 1];
        if (curveValue === undefined) {
            throw new TypeError(`Relic ability level ${relicAbilityLevel} is outside the power curve`);
        }
        relicPower = curveValue;
    }

    const traitMultiplier = traitMultiplierOf(unit, unitsConfig);
    const movement = numberAt(unit, 'Movement', 'unit');
    const unitPowerMultiplier = typeof unit.powerMultiplier === 'number' ? unit.powerMultiplier : 100;
    const rawPower =
        (10 + traitMultiplier * ((statsPower * Math.sqrt(movement)) / 100 + abilitiesPower + relicPower)) *
        (unitPowerMultiplier / 100);
    return Math.round(rawPower);
}

function calculateMachinePower(
    input: RosterMowPowerInput,
    unit: JsonObject,
    progressionStep: JsonObject,
    unitsConfig: JsonObject
): number {
    const abilityPowerCurve = objectAt(unitsConfig, 'abilityPowerCurve');
    const activeCurve = numberArrayAt(abilityPowerCurve, 'active', 'units.abilityPowerCurve');
    const passiveCurve = numberArrayAt(abilityPowerCurve, 'passive', 'units.abilityPowerCurve');
    const abilityModifiers = objectAt(unitsConfig, 'abilityPowerModifiers');
    const ids = stringArray(unit.activeAbilities, 'machine.activeAbilities');
    const primaryId = ids[0];
    const secondaryId = ids[1];
    if (!primaryId || !secondaryId) {
        throw new TypeError(`${input.unitId} must have two active abilities`);
    }
    const primaryPower = abilityPower(primaryId, input.primaryAbilityLevel, activeCurve, abilityModifiers);
    const secondaryPower = abilityPower(secondaryId, input.secondaryAbilityLevel, passiveCurve, abilityModifiers);
    const abilityMultiplier = integerAt(progressionStep, 'abilityPowerMultiplier', 'machine.progressionStep');
    const mythicAbilityPower = numberOrZero(progressionStep.mythicAbilityPower);

    const traitMultiplier = traitMultiplierOf(unit, unitsConfig);
    const unitPowerMultiplier = typeof unit.powerMultiplier === 'number' ? unit.powerMultiplier : 100;
    const rawPower =
        (10 + traitMultiplier * ((primaryPower + secondaryPower) * abilityMultiplier + mythicAbilityPower)) *
        (unitPowerMultiplier / 100);
    return Math.round(rawPower);
}

function traitMultiplierOf(unit: JsonObject, unitsConfig: JsonObject): number {
    const traitModifiers = objectAt(unitsConfig, 'traitPowerModifiers');
    let traitMultiplier = 1;
    for (const trait of stringArray(unit.traits, 'unit.traits')) {
        const modifier = traitModifiers[trait];
        if (typeof modifier === 'number') {
            traitMultiplier *= modifier / 100;
        }
    }
    return traitMultiplier;
}

function abilityPower(abilityId: string, level: number, curve: number[], modifiers: JsonObject): number {
    if (level < 1) return 0;
    const base = curve[level - 1];
    if (base === undefined) {
        throw new TypeError(`Ability level ${level} is outside the power curve`);
    }
    const modifier = optionalObject(modifiers[abilityId]);
    return base * (modifier ? numberOrDefault(modifier.baseMultiplier, 100) / 100 : 1);
}

function getProgressionStep(unitsConfig: JsonObject, unitId: string, progressionIndex: number): JsonObject {
    const perUnit = objectAt(unitsConfig, 'heroProgressionStepsPerUnit');
    const defaults = (perUnit.default as unknown) ?? unitsConfig.heroProgressionSteps;
    if (!Array.isArray(defaults)) {
        throw new TypeError(`GameConfig has no progression steps for ${unitId}`);
    }
    const defaultStep = requireObject(defaults[progressionIndex], `${unitId}.defaultProgressionStep`);
    const overrides = perUnit[unitId];
    if (overrides === undefined) {
        return defaultStep;
    }
    if (!Array.isArray(overrides)) {
        throw new TypeError(`GameConfig progression override for ${unitId} must be an array`);
    }
    const override = requireObject(overrides[progressionIndex], `${unitId}.progressionStepOverride`);
    return { ...defaultStep, ...override };
}

function getMachineProgressionStep(unitsConfig: JsonObject, unitId: string, progressionIndex: number): JsonObject {
    const steps = unitsConfig.heroProgressionStepsMoW;
    if (!Array.isArray(steps)) {
        throw new TypeError(`GameConfig has no MoW progression steps for ${unitId}`);
    }
    return requireObject(steps[progressionIndex], `${unitId}.machineProgressionStep`);
}

function addUpgradeRow(
    stats: Stats,
    ids: string[] | undefined,
    increases: number[] | undefined,
    upgradeConfigs: JsonObject,
    unitId: string
): void {
    if (!ids || !increases || ids.length !== increases.length) {
        throw new TypeError(`Invalid upgrade row for ${unitId}`);
    }
    for (const [index, id] of ids.entries()) {
        const increase = increases[index];
        if (increase === undefined) {
            throw new TypeError(`Missing upgrade stat increase for ${unitId}`);
        }
        addUpgrade(stats, id, increase, upgradeConfigs, unitId);
    }
}

function addUpgrade(
    stats: Stats,
    upgradeId: string,
    increase: number,
    upgradeConfigs: JsonObject,
    unitId: string
): void {
    const config = requireObject(upgradeConfigs[upgradeId], `GameConfig.upgrades.${upgradeId}`);
    switch (stringAt(config, 'statType', `upgrade ${upgradeId}`)) {
        case 'hp': {
            stats.health += increase;
            break;
        }
        case 'dmg': {
            stats.damage += increase;
            break;
        }
        case 'fixedArmor': {
            stats.fixedArmor += increase;
            break;
        }
        default: {
            throw new TypeError(`Unsupported upgrade stat on ${upgradeId} for ${unitId}`);
        }
    }
}

function mergeStats(target: Stats, source: Stats): void {
    target.health += source.health;
    target.damage += source.damage;
    target.fixedArmor += source.fixedArmor;
    target.critChance += source.critChance;
    target.critDamage += source.critDamage;
    target.blockChance += source.blockChance;
    target.blockDamage += source.blockDamage;
}

function stackChance(current: number, added: number): number {
    return current + Math.trunc((1 - current / 100) * added);
}

function geometricPartial(ratio: number, terms: number): number {
    let sum = 0;
    let term = ratio;
    for (let index = 0; index < terms; index += 1) {
        sum += term;
        term *= ratio;
    }
    return sum;
}

function emptyStats(): Stats {
    return {
        health: 0,
        damage: 0,
        fixedArmor: 0,
        critChance: 0,
        critDamage: 0,
        blockChance: 0,
        blockDamage: 0,
        critChanceBonus: 0,
        critDamageBonus: 0,
        blockChanceBonus: 0,
        blockDamageBonus: 0,
    };
}

function objectAt(value: JsonObject, key: string): JsonObject {
    return requireObject(value[key], key);
}

function optionalObject(value: unknown): JsonObject | undefined {
    return value !== null && typeof value === 'object' && !Array.isArray(value) ? (value as JsonObject) : undefined;
}

function requireObject(value: unknown, field: string): JsonObject {
    const object = optionalObject(value);
    if (!object) {
        throw new TypeError(`${field} must be an object`);
    }
    return object;
}

function integerAt(value: JsonObject, key: string, field: string): number {
    const number = numberAt(value, key, field);
    if (!Number.isInteger(number)) {
        throw new TypeError(`${field}.${key} must be an integer`);
    }
    return number;
}

function numberAt(value: JsonObject, key: string, field: string): number {
    const number = value[key];
    if (typeof number !== 'number' || !Number.isFinite(number)) {
        throw new TypeError(`${field}.${key} must be a finite number`);
    }
    return number;
}

function stringAt(value: JsonObject, key: string, field: string): string {
    const string = value[key];
    if (typeof string !== 'string') {
        throw new TypeError(`${field}.${key} must be a string`);
    }
    return string;
}

function numberOrZero(value: unknown): number {
    return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function numberOrDefault(value: unknown, fallback: number): number {
    return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function stringArray(value: unknown, field: string): string[] {
    if (!Array.isArray(value) || !value.every(item => typeof item === 'string')) {
        throw new TypeError(`${field} must be a string array`);
    }
    return value;
}

function numberArrayAt(value: JsonObject, key: string, field: string): number[] {
    const array = value[key];
    if (!Array.isArray(array) || !array.every(item => typeof item === 'number')) {
        throw new TypeError(`${field}.${key} must be a number array`);
    }
    return array;
}

function nestedStringArrays(value: unknown, field: string): string[][] {
    if (!Array.isArray(value)) {
        throw new TypeError(`${field} must be an array`);
    }
    return value.map((row, index) => stringArray(row, `${field}[${index}]`));
}

function nestedNumberArrays(value: unknown, field: string): number[][] {
    if (!Array.isArray(value)) {
        throw new TypeError(`${field} must be an array`);
    }
    return value.map((row, index) => {
        if (!Array.isArray(row) || !row.every(item => typeof item === 'number')) {
            throw new TypeError(`${field}[${index}] must be a number array`);
        }
        return row;
    });
}

function arrayOfObjects(value: unknown, field: string): JsonObject[] {
    if (!Array.isArray(value)) {
        throw new TypeError(`${field} must be an array`);
    }
    return value.map((item, index) => requireObject(item, `${field}[${index}]`));
}
