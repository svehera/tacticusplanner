/* eslint-disable import-x/no-internal-modules */
import { abilityIcons } from '@/fsd/5-shared/ui/ability-icons';
import { getImageUrl } from '@/fsd/5-shared/ui/get-image-url';
import { tacticusIcons } from '@/fsd/5-shared/ui/icons/icon-list';

import type { GuildBossEncounterModifier, GuildBossModifierDefinition } from './guild-boss.model';
import {
    formatAbilityName,
    getUnitDisplayName,
    getUnitSetId,
    guildBossData,
    resolveNpcUnitPortraitPath,
} from './guild-boss.service';

const STAT_STYLE_TAGS: Record<string, string> = {
    dmg: 'Stat_Damage',
    hp: 'Stat_Health',
    movement: 'Stat_Movement',
    fixedArmor: 'Stat_Armor',
    hits: 'Stat_Hits',
    blockChance: 'Stat_Block',
    critDmg: 'Stat_CritDamage',
    critChance: 'Stat_CritChance',
    minDmg: 'Stat_Damage',
    maxDmg: 'Stat_Damage',
    hpPct: 'Stat_Health',
    nrOfHits: 'Stat_Hits',
    nrOfAttacks: 'Stat_Hits',
    nrOfTargets: 'Stat_Range',
};

const STAT_NAMES: Record<string, string> = {
    dmg: 'Damage',
    hp: 'HP',
    movement: 'Movement',
    fixedArmor: 'Armor',
    hits: 'Hits',
    blockChance: 'Block Chance',
    critDmg: 'Crit Damage',
    critChance: 'Crit Chance',
    nrOfTargets: 'Targets',
    nrOfHits: 'Hits',
    nrOfAttacks: 'Attacks',
    nrOfSummons: 'Summons',
    nrOfRounds: 'Rounds',
    nrOfCrits: 'Crits',
    stunChance: 'Stun Chance',
    extraCritChance: 'Crit Chance',
    hpPct: 'HP %',
    chance: 'Chance',
    minDmg: 'Min Damage',
    maxDmg: 'Max Damage',
    summonHp: 'Summon HP',
    summonDmg: 'Summon Damage',
    summonArmor: 'Summon Armor',
    dmgPctReduction: 'Damage Reduction',
};

const STAT_ICONS: Record<string, { file: string; name: string }[] | undefined> = {
    dmg: [{ file: tacticusIcons.damage.file, name: 'Damage' }],
    hp: [{ file: tacticusIcons.health.file, name: 'HP' }],
    movement: [{ file: tacticusIcons.movement.file, name: 'Movement' }],
    fixedArmor: [{ file: tacticusIcons.armour.file, name: 'Armor' }],
    blockChance: [
        { file: tacticusIcons.block.file, name: 'Block' },
        { file: tacticusIcons.chance.file, name: 'Chance' },
    ],
    critChance: [
        { file: tacticusIcons.critDamage.file, name: 'Crit' },
        { file: tacticusIcons.chance.file, name: 'Chance' },
    ],
    critDmg: [{ file: tacticusIcons.critDamage.file, name: 'Crit Damage' }],
};

function signedAmount(n: number): string {
    return n >= 0 ? `+${n}` : String(n);
}

function styledStat(key: string): string {
    const label = STAT_NAMES[key] ?? formatAbilityName(key);
    const tag = STAT_STYLE_TAGS[key];
    return tag ? `<style="${tag}">${label}</style>` : label;
}

function parseSubtargets(modifierDefinition: GuildBossModifierDefinition): string[] {
    if (modifierDefinition.subtargets && modifierDefinition.subtargets.length > 0) return modifierDefinition.subtargets;
    if (modifierDefinition.subtarget) return modifierDefinition.subtarget.split(',');
    return [];
}

function subLabels(modifierDefinition: GuildBossModifierDefinition): string {
    const targets = parseSubtargets(modifierDefinition);
    if (targets.length === 0) return '';
    return targets.map(s => styledStat(s)).join(', ');
}

export function describeModifier(modifierDefinition: GuildBossModifierDefinition): string {
    const { type, target, amount } = modifierDefinition;
    const abilityName = formatAbilityName(target);
    const sub = subLabels(modifierDefinition);

    switch (type) {
        case 'bossStatDecrease': {
            return `${styledStat(target)} -${amount}`;
        }
        case 'bossStatPctDecrease': {
            return `${styledStat(target)} -${amount}%`;
        }
        case 'bossAbilityAllStatsPctDecrease': {
            return `${abilityName}: all stats -${amount}%`;
        }
        case 'bossAbilityConstantDecrease':
        case 'bossAbilityVariableDecrease': {
            return `${abilityName}${sub ? `: ${sub}` : ''} -${amount}`;
        }
        case 'bossAbilityConstantIncrease':
        case 'bossAbilityVariableIncrease': {
            return `${abilityName}${sub ? `: ${sub}` : ''} ${signedAmount(amount)}`;
        }
        case 'bossAbilityVariablePctDecrease': {
            return `${abilityName}${sub ? `: ${sub}` : ''} -${amount}%`;
        }
        case 'unitStatPctDecrease': {
            const unitName = getUnitDisplayName(target);
            return `${unitName}${sub ? `: ${sub}` : ''} -${amount}%`;
        }
        case 'unitAmountDecrease': {
            const subs = parseSubtargets(modifierDefinition);
            const unitName = subs[0] ? getUnitDisplayName(subs[0]) : abilityName;
            return `${amount} ${unitName} removed from the battlefield`;
        }
        default: {
            return formatAbilityName(type);
        }
    }
}

export function getModifierTitle(modifierDefinition: GuildBossModifierDefinition): string {
    if (modifierDefinition.type === 'unitAmountDecrease') {
        const subs = parseSubtargets(modifierDefinition);
        return subs[0] ? getUnitDisplayName(subs[0]) : formatAbilityName(modifierDefinition.target);
    }
    if (modifierDefinition.type.startsWith('bossStat')) {
        return STAT_NAMES[modifierDefinition.target] ?? formatAbilityName(modifierDefinition.target);
    }
    return formatAbilityName(modifierDefinition.target);
}

export function getModifierPortraitUrl(modifierDefinition: GuildBossModifierDefinition): string | undefined {
    if (modifierDefinition.type !== 'unitAmountDecrease') return undefined;
    const subs = parseSubtargets(modifierDefinition);
    const unitSetId = subs[0];
    if (!unitSetId) return undefined;
    const path = resolveNpcUnitPortraitPath(unitSetId);
    return path ? getImageUrl(path) : undefined;
}

export function getModifierIcon(
    modifierDefinition: GuildBossModifierDefinition
): { file: string; name: string }[] | undefined {
    if (modifierDefinition.type.startsWith('bossAbility')) {
        const icon = abilityIcons[modifierDefinition.target as keyof typeof abilityIcons];
        return icon ? [icon] : undefined;
    }
    if (modifierDefinition.type.startsWith('bossStat')) {
        return STAT_ICONS[modifierDefinition.target];
    }
    return undefined;
}

export interface ModifierDisplay {
    title: string;
    description: string;
    portraitUrl?: string;
    abilityIcons?: { file: string; name: string }[];
}

/** Resolves the title/description/portrait/icon to show for a modifier key, falling back to a
 *  formatted version of the raw key when the modifier definition itself can't be found. */
export function resolveModifierDisplay(modifierKey: string): ModifierDisplay {
    const modifierDefinition = guildBossData.modifiers[modifierKey];
    if (!modifierDefinition) {
        const fallback = formatAbilityName(modifierKey);
        return { title: fallback, description: fallback };
    }
    return {
        title: getModifierTitle(modifierDefinition),
        description: describeModifier(modifierDefinition),
        portraitUrl: getModifierPortraitUrl(modifierDefinition),
        abilityIcons: getModifierIcon(modifierDefinition),
    };
}

/** Sorts an encounter's modifiers ascending by `hpLost` (the order they activate in as HP drops). */
export function sortModifiersByHpLost(encounterModifiers: GuildBossEncounterModifier[]): GuildBossEncounterModifier[] {
    return encounterModifiers.toSorted((a, b) => a.hpLost - b.hpLost);
}

/** Builds the dropdown's `hpLost` option list: 0 (full HP) plus every threshold in the (already-sorted) list. */
export function buildModifierHpLostOptions(sortedModifiers: GuildBossEncounterModifier[]): number[] {
    return [0, ...sortedModifiers.map(m => m.hpLost)];
}

/**
 * Rescales an encounter's authored `hpLost` thresholds to whatever total HP is currently displayed.
 * Every encounter's raw `hpLost` values are an exact `i/N` fraction of the total HP baseline they were
 * authored against (`N = modifiers.length`); since the currently-displayed total HP can differ from that
 * baseline (progression level is user-selectable), rescale so the schedule stays proportional and the last
 * entry always lands exactly at `currentTotalHp` (0 remaining), rounding-safe.
 */
export function scaleModifierHpLost(
    encounterModifiers: GuildBossEncounterModifier[],
    currentTotalHp: number
): GuildBossEncounterModifier[] {
    const n = encounterModifiers.length;
    return encounterModifiers.map((m, index) => {
        const position = index + 1;
        const hpLost = position === n ? currentTotalHp : Math.round((currentTotalHp * position) / n);
        return { ...m, hpLost };
    });
}

/** Resolves the `hpLost`-gated modifiers that are active at or above the given HP-loss threshold. */
export function getActiveModifierDefinitions(
    encounterModifiers: GuildBossEncounterModifier[],
    selectedHpLost: number
): GuildBossModifierDefinition[] {
    return encounterModifiers
        .filter(m => m.hpLost <= selectedHpLost)
        .map(m => guildBossData.modifiers[m.modifier])
        .filter((d): d is GuildBossModifierDefinition => d !== undefined);
}

export interface StatAdjustments {
    /** Signed percentage points per boss stat key, e.g. `{ dmg: -45 }`. */
    pctByStat: Record<string, number>;
    /** Signed flat delta per boss stat key, e.g. `{ movement: -1 }`. */
    flatByStat: Record<string, number>;
}

/** Sums `bossStatDecrease`/`bossStatPctDecrease` modifiers additively per stat key. */
export function computeStatAdjustments(activeDefs: GuildBossModifierDefinition[]): StatAdjustments {
    const pctByStat: Record<string, number> = {};
    const flatByStat: Record<string, number> = {};
    for (const modifierDefinition of activeDefs) {
        if (modifierDefinition.type === 'bossStatPctDecrease')
            pctByStat[modifierDefinition.target] =
                (pctByStat[modifierDefinition.target] ?? 0) - modifierDefinition.amount;
        if (modifierDefinition.type === 'bossStatDecrease')
            flatByStat[modifierDefinition.target] =
                (flatByStat[modifierDefinition.target] ?? 0) - modifierDefinition.amount;
    }
    return { pctByStat, flatByStat };
}

/** Applies the cumulative adjustment for `statKey` to `base`, clamped at 0. */
export function applyStatAdjustment(base: number, statKey: string, adjustments: StatAdjustments): number {
    const pct = adjustments.pctByStat[statKey] ?? 0;
    const flat = adjustments.flatByStat[statKey] ?? 0;
    return Math.max(0, Math.round(base * (1 + pct / 100) + flat));
}

export interface AbilityAdjustments {
    /** Signed percentage points applying to every variable of the ability (`bossAbilityAllStatsPctDecrease`). */
    pctAll: number;
    /** Signed percentage points per named variable. */
    pctByVariable: Record<string, number>;
    /** Signed flat delta per named variable. */
    flatByVariable: Record<string, number>;
}

/** Sums the modifiers targeting a specific ability's variables, additively. */
export function computeAbilityVariableAdjustments(
    activeDefs: GuildBossModifierDefinition[],
    abilityId: string
): AbilityAdjustments {
    const result: AbilityAdjustments = { pctAll: 0, pctByVariable: {}, flatByVariable: {} };
    for (const modifierDefinition of activeDefs.filter(d => d.target === abilityId)) {
        const subs = parseSubtargets(modifierDefinition);
        const sign = modifierDefinition.type.includes('Increase') ? 1 : -1;
        if (modifierDefinition.type === 'bossAbilityAllStatsPctDecrease') {
            result.pctAll -= modifierDefinition.amount;
        } else if (modifierDefinition.type.includes('Pct')) {
            for (const s of subs)
                result.pctByVariable[s] = (result.pctByVariable[s] ?? 0) + sign * modifierDefinition.amount;
        } else {
            for (const s of subs)
                result.flatByVariable[s] = (result.flatByVariable[s] ?? 0) + sign * modifierDefinition.amount;
        }
    }
    return result;
}

/** Applies ability-variable adjustments to every entry in each affected variable's array, clamped at 0. */
export function applyAbilityAdjustments(
    variables: Record<string, (string | number)[]>,
    adjustments: AbilityAdjustments
): Record<string, (string | number)[]> {
    const out: Record<string, (string | number)[]> = {};
    for (const [key, values] of Object.entries(variables)) {
        const pct = adjustments.pctAll + (adjustments.pctByVariable[key] ?? 0);
        const flat = adjustments.flatByVariable[key] ?? 0;
        out[key] =
            pct === 0 && flat === 0
                ? values
                : values.map(v => {
                      const n = Number(v);
                      return Number.isNaN(n) ? v : Math.max(0, Math.round(n * (1 + pct / 100) + flat));
                  });
    }
    return out;
}

/** Same adjustment math as `applyAbilityAdjustments`, for ability constants (single scalar values, not per-level arrays). */
export function applyAbilityConstantAdjustments(
    constants: Record<string, string>,
    adjustments: AbilityAdjustments
): Record<string, string> {
    const out: Record<string, string> = {};
    for (const [key, value] of Object.entries(constants)) {
        const pct = adjustments.pctAll + (adjustments.pctByVariable[key] ?? 0);
        const flat = adjustments.flatByVariable[key] ?? 0;
        if (pct === 0 && flat === 0) {
            out[key] = value;
            continue;
        }
        const n = Number(value);
        out[key] = Number.isNaN(n) ? value : String(Math.max(0, Math.round(n * (1 + pct / 100) + flat)));
    }
    return out;
}

/** Sums `unitAmountDecrease` modifiers into a removal count per targeted unitSetId. */
export function getUnitRemovals(activeDefs: GuildBossModifierDefinition[]): Record<string, number> {
    const removals: Record<string, number> = {};
    for (const modifierDefinition of activeDefs) {
        if (modifierDefinition.type !== 'unitAmountDecrease') continue;
        const unitSetId = parseSubtargets(modifierDefinition)[0];
        if (!unitSetId) continue;
        removals[unitSetId] = (removals[unitSetId] ?? 0) + modifierDefinition.amount;
    }
    return removals;
}

/** Removes up to `removals[unitSetId]` copies of each matching unit from `enemyIds` (progression suffix stripped for matching). */
export function applyUnitRemovals(enemyIds: string[], removals: Record<string, number>): string[] {
    const remaining = { ...removals };
    return enemyIds.filter(rawId => {
        const unitSetId = getUnitSetId(rawId);
        if ((remaining[unitSetId] ?? 0) > 0) {
            remaining[unitSetId] -= 1;
            return false;
        }
        return true;
    });
}
