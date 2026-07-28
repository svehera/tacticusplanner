/* eslint-disable boundaries/element-types */
/* eslint-disable import-x/no-internal-modules */
import type {
    HomescreenEventAbilityDefinition,
    HomescreenEventGameModeRestrictions,
    HomescreenEventModifier,
    HomescreenEventTier,
    HomescreenEventTracker,
} from '@/fsd/4-entities/homescreen_events';

import { parseAbilityText, type AstNode } from '@/fsd/3-features/character-details/ability-text';

export interface HseDescriptionLine {
    text: string;
    constants: Record<string, string>;
    variables: Record<string, (string | number)[]>;
}

type HseConfigItem = HomescreenEventModifier | HomescreenEventTracker;

/** Strips game-side text-layout hints (line-wrap/vertical-offset tags) that AbilityText doesn't render. */
function stripLayoutOnlyTags(text: string): string {
    return text.replaceAll(/<\/?nobr>|<voffset=[^>]*>|<\/voffset>/g, '');
}

/** Short human labels for the game-mode ids seen in `gameModeRestrictions.allowed`. */
const GAME_MODE_LABELS: Record<string, string> = {
    Campaign: 'Normal',
    MirrorCampaign: 'Mirror',
    CampaignEvent: 'CE',
    EliteCampaign: 'Elite Campaign',
    MirrorEliteCampaign: 'Elite Campaign',
    Waves: 'Onslaught',
    TreasureBeach: 'Salvage Run',
    PvP: 'Arena',
    SyncPVP: 'Sync Arena',
    MachinesOfWarEvent: 'Machine of War Events',
    GuildWars: 'Guild Wars',
    LinearHeroEvent: 'Linear Hero Event',
    Survival: 'Survival',
    LegendaryEvent: 'Legendary Events',
};

function joinWithAnd(items: string[]): string {
    if (items.length <= 1) return items[0] ?? '';
    if (items.length === 2) return `${items[0]} and ${items[1]}`;
    return `${items.slice(0, -1).join(', ')}, and ${items.at(-1)}`;
}

/** Describes which game modes a modifier/tracker applies to, e.g. "Normal, Mirror, and CE Battles" or "Other Modes". */
function describeGameModeGroup(restrictions: HomescreenEventGameModeRestrictions | undefined): string {
    if (!restrictions?.allowed) return 'Other Modes';
    const labels = [...new Set(restrictions.allowed.map(id => GAME_MODE_LABELS[id] ?? id))];
    return `${joinWithAnd(labels)} Battles`;
}

/** Recursively collects every referenced variable name from a parsed ability-text AST. */
export function collectVariableNames(nodes: AstNode[]): string[] {
    const names: string[] = [];
    for (const node of nodes) {
        if (node.type === 'var') {
            if (!node.isUnitName && node.name) names.push(node.name);
        } else if (node.type === 'styled') {
            names.push(...collectVariableNames(node.children));
        }
    }
    return names;
}

function unresolvedVariableNames(
    text: string,
    constants: Record<string, string>,
    variables: Record<string, unknown>
): string[] {
    return collectVariableNames(parseAbilityText(text)).filter(name => !(name in constants) && !(name in variables));
}

/** Groups items sharing the same `locaKey`, preserving first-occurrence order (both across and within groups). */
function groupByLocaKey<T extends { locaKey?: string }>(items: T[]): T[][] {
    const order: string[] = [];
    const groups = new Map<string, T[]>();
    for (const [index, item] of items.entries()) {
        const key = item.locaKey ?? `__no_locakey_${index}`;
        if (!groups.has(key)) {
            order.push(key);
            groups.set(key, []);
        }
        groups.get(key)!.push(item);
    }
    return order.map(key => groups.get(key)!);
}

/** Builds the {constants, variables} context AbilityText needs to render a single modifier/tracker's text. */
function contextFor(
    item: HseConfigItem,
    abilities: Record<string, HomescreenEventAbilityDefinition>
): { constants: Record<string, string>; variables: Record<string, (string | number)[]> } {
    const constants: Record<string, string> = {};
    const variables: Record<string, (string | number)[]> = {};

    const modifier = (item as HomescreenEventModifier).modifier;
    if (modifier !== undefined) constants.MODIFIER = String(modifier / 100);

    const modifiersByRarity = (item as HomescreenEventModifier).modifiers;
    if (modifiersByRarity) {
        for (const [rarity, value] of Object.entries(modifiersByRarity)) {
            constants[`MODIFIER_${rarity}`] = String(value / 100);
        }
    }

    const points = (item as HomescreenEventTracker).points;
    if (points !== undefined) constants.POINTS = String(points);

    const pointsByRarity = (item as HomescreenEventTracker).pointsByRarity;
    if (pointsByRarity) {
        for (const [rarity, value] of Object.entries(pointsByRarity)) {
            constants[`POINTS_${rarity}`] = String(value);
        }
    }

    const abilityId = (item as HomescreenEventModifier).abilityId;
    const abilityDefinition = abilityId ? abilities[abilityId] : undefined;
    if (abilityDefinition) {
        Object.assign(constants, abilityDefinition.ability.constants);
        Object.assign(variables, abilityDefinition.ability.variables);
    }

    return { constants, variables };
}

/** The scalar field (if any) whose value differs across a locaKey-group's items — the thing a mode-split renders separately. */
function findSplitField(group: HseConfigItem[]): 'points' | 'modifier' | undefined {
    if (group.length <= 1) return undefined;

    const pointsValues = new Set(
        group.map(item => (item as HomescreenEventTracker).points).filter(value => value !== undefined)
    );
    if (pointsValues.size > 1) return 'points';

    const modifierValues = new Set(
        group.map(item => (item as HomescreenEventModifier).modifier).filter(value => value !== undefined)
    );
    if (modifierValues.size > 1) return 'modifier';

    return undefined;
}

/** One representative item per distinct value of `field`, in first-occurrence order. */
function distinctByField(group: HseConfigItem[], field: 'points' | 'modifier'): HseConfigItem[] {
    const seen = new Set<number>();
    const result: HseConfigItem[] = [];
    for (const item of group) {
        const value =
            field === 'points' ? (item as HomescreenEventTracker).points : (item as HomescreenEventModifier).modifier;
        if (value === undefined || seen.has(value)) continue;
        seen.add(value);
        result.push(item);
    }
    return result;
}

/**
 * Resolves a tier's `descriptions[]` into renderable lines with fully-populated AbilityText contexts.
 *
 * `descriptions[0]`/`[1]` are always the flavor title/subtitle. From index 2 on, each description maps
 * positionally to one modifier/tracker, deduped by `locaKey` (several modifiers/trackers can share a
 * locaKey when the same reward pays a different amount per game mode — those render as one line per
 * distinct value, labeled with the game modes it applies to). Lines that still reference a variable with
 * no known value are dropped rather than shown with a raw unresolved token.
 */
export function resolveHseDescriptionLines(tier: HomescreenEventTier): HseDescriptionLine[] {
    const descriptions = tier.descriptions ?? [];
    if (descriptions.length === 0) return [];

    const abilities = tier.abilities ?? {};
    const groups = [
        ...groupByLocaKey(tier.liveEventConfig?.modifiers ?? []),
        ...groupByLocaKey(tier.liveEventConfig?.trackers ?? []),
    ];
    const groupsAlign = groups.length === descriptions.length - 2;

    const lines: HseDescriptionLine[] = [];
    const pushIfResolved = (
        text: string,
        constants: Record<string, string>,
        variables: Record<string, (string | number)[]>
    ) => {
        if (unresolvedVariableNames(text, constants, variables).length === 0) {
            lines.push({ text, constants, variables });
        }
    };

    for (const [index, rawText] of descriptions.entries()) {
        const text = stripLayoutOnlyTags(rawText);
        if (index < 2 || !groupsAlign) {
            pushIfResolved(text, {}, {});
            continue;
        }

        const group = groups[index - 2];
        const splitField = findSplitField(group);
        if (!splitField) {
            const { constants, variables } = contextFor(group[0], abilities);
            pushIfResolved(text, constants, variables);
            continue;
        }

        for (const representative of distinctByField(group, splitField)) {
            const label = describeGameModeGroup(representative.gameModeRestrictions);
            const { constants, variables } = contextFor(representative, abilities);
            pushIfResolved(`${label}: ${text}`, constants, variables);
        }
    }

    return lines;
}
