/* eslint-disable import-x/no-internal-modules */
import { snowprintIcons } from '@/fsd/5-shared/assets';
import { Rarity } from '@/fsd/5-shared/model';
import { tacticusIcons } from '@/fsd/5-shared/ui/icons/icon-list';

// ── Colors ───────────────────────────────────────────────────────────────────

export const ABILITY_COLORS = {
    stat: '#2dd4bf',
    buff: '#22c55e',
    debuff: '#dc2626',
    red: '#dc2626',
    purple: '#a855f7',
} as const;

// Per-damage-type colors
const DMG_TYPE_COLORS: Record<string, string> = {
    Acid: '#7dd3fc',
    Bio: '#a855f7',
    Blast: '#f97316',
    Bolter: '#eab308',
    Chain: '#fef08a',
    DirectDamage: '#7dd3fc',
    Energy: '#22c55e',
    Enmitic: '#7dd3fc',
    Eviscerate: '#9ca3af',
    Flame: '#ea580c',
    Gauss: '#22c55e',
    HeavyRound: '#eab308',
    Las: '#dc2626',
    Melta: '#f87171',
    None: '#7dd3fc',
    Particle: '#22c55e',
    Physical: '#60a5fa',
    Piercing: '#e2e8f0',
    Plasma: '#7dd3fc',
    Power: '#38bdf8',
    Projectile: '#eab308',
    Psychic: '#d946ef',
    Pulse: '#7dd3fc',
    Toxic: '#22c55e',
};

// ── Faction color map ─────────────────────────────────────────────────────────
// Keys match snowprintId (= the part after "Faction_" in style names)

export const FACTION_COLORS: Record<string, string> = {
    Ultramarines: '#3A81E8',
    Sisterhood: '#9D2C23',
    AdeptusAstartes: '#9D2C23',
    Necrons: '#65C088',
    AstraMilitarum: '#A5A586',
    BlackLegion: '#900405',
    DeathGuard: '#87993D',
    Orks: '#FDE038',
    BlackTemplars: '#5E6265',
    Aeldari: '#A82426',
    Tau: '#F2A55C',
    SpaceWolves: '#94C5DC',
    ThousandSons: '#F9CB00',
    DarkAngels: '#72A67C',
    Tyranids: '#DF6DE6',
    AdeptusMechanicus: '#A82426',
    WorldEaters: '#900405',
    BloodAngels: '#D8001C',
    Genestealers: '#FF8500',
    Custodes: '#E6703D',
    EmperorsChildren: '#DB7093',
    LeaguesOfVotann: '#94C5DC',
    Votann: '#94C5DC',
};

// ── Style spec ────────────────────────────────────────────────────────────────

export interface StyleSpec {
    color?: string;
    /** gradient CSS value for background-image (used instead of color) */
    gradient?: string;
    underline?: boolean;
    italic?: boolean;
    icon?: string;
    iconAlt?: string;
    /** Override the rendered text content regardless of inner content */
    overrideText?: string;
}

// Trait style name → snowprintIcons key
const TRAIT_STYLE_TO_ICON: Record<string, string> = {
    Act_Of_Faith: 'traitActOfFaith',
    Battle_Fatigue: 'traitBattleFatigue',
    Big_Target: 'traitBigTarget',
    BlessingsOfKhorne: 'traitBlessingOfKhorne',
    Camouflage: 'traitCamouflage',
    ContagionsOfNurgle: 'traitContagions',
    Daemon: 'traitDaemonic',
    Decoy: 'traitDecoy',
    Emplacement: 'traitEmplacement',
    FinalJustice: 'traitOnlyInDeath',
    Flying: 'traitFlying',
    Heavy_Weapon: 'traitHeavyWeapon',
    Immune: 'traitImmune',
    Indirect_Fire: 'traitIndirectFire',
    Infiltrate: 'traitInfiltrate',
    Living_Metal: 'traitLivingMetall',
    Mechanic: 'traitMechanic',
    Mechanical: 'traitMechanical',
    Mk_Gravis: 'traitMkGravis',
    Overwatch: 'traitOverwatch',
    PrioritisedEfficiency: 'traitPrioritisedEfficiency',
    Psyker: 'traitPsychic',
    RangedSpecialist: 'traitRangedSpecialist',
    RapidAssault: 'traitRapidAssault',
    Steppable: 'traitSteppable',
    Summon: 'traitSummon',
    Suppressive_Fire: 'traitSuppressiveFire',
    Synapse: 'traitSynapse',
    Teleport_Strike_short: 'traitTeleportStrike',
    Terminator_Armor: 'traitTerminatorArmour',
    ThrillSeekers: 'traitThrillSeekers',
    Unstoppable: 'traitMounted',
    Vehicle: 'traitVehicle',
};

// Stat style name → tacticusIcons / snowprintIcons key
const STAT_STYLE_TO_ICON: Record<string, string> = {
    Stat_Armor: 'armour',
    Stat_Block: 'block',
    Stat_Chance: 'chance',
    Stat_CritChance: 'chance',
    Stat_CritDamage: 'critDamage',
    Stat_Damage: 'damage',
    Stat_Health: 'health',
    Stat_Hits: 'hitsIcon',
    Stat_Melee: 'meleeAttack',
    Stat_Movement: 'movement',
    Stat_Range: 'rangedAttack',
};

function traitSpec(iconKey: string, color?: string): StyleSpec {
    const icon = snowprintIcons[iconKey];
    return { icon: icon?.file, iconAlt: icon?.label ?? iconKey, underline: true, color };
}

export function getStyleSpec(styleName: string): StyleSpec | undefined {
    // ── Faction ───────────────────────────────────────────────────────────────
    if (styleName.startsWith('Faction_')) {
        const factionId = styleName.slice('Faction_'.length);
        return { color: FACTION_COLORS[factionId] ?? '#ffffff' };
    }

    // ── Alliance ──────────────────────────────────────────────────────────────
    if (styleName.startsWith('Aliance_')) {
        const alliance = styleName.slice('Aliance_'.length).toLowerCase() as 'chaos' | 'imperial' | 'xenos';
        const iconKey = `alliance${alliance.charAt(0).toUpperCase() + alliance.slice(1)}` as
            | 'allianceChaos'
            | 'allianceImperial'
            | 'allianceXenos';
        const icon = snowprintIcons[iconKey];
        return { color: ABILITY_COLORS.purple, underline: true, icon: icon?.file, iconAlt: alliance };
    }

    // ── Damage type ───────────────────────────────────────────────────────────
    if (styleName.startsWith('DMG_')) {
        const dmgType = styleName.slice('DMG_'.length);
        const icon = snowprintIcons[`damage${dmgType}`];
        const color = DMG_TYPE_COLORS[dmgType] ?? '#7dd3fc';
        return { color, underline: true, icon: icon?.file, iconAlt: dmgType };
    }

    // ── Stats ─────────────────────────────────────────────────────────────────
    if (styleName.startsWith('Stat_')) {
        const iconKey = STAT_STYLE_TO_ICON[styleName];
        const icon = iconKey ? (tacticusIcons[iconKey] ?? snowprintIcons[iconKey]) : undefined;
        return { color: ABILITY_COLORS.stat, icon: icon?.file, iconAlt: styleName };
    }

    // ── Stat variants (no underscore) ─────────────────────────────────────────
    if (styleName === 'STAT' || styleName === 'Stat' || styleName === 'stat') {
        return { color: ABILITY_COLORS.stat };
    }

    // ── Debuffs ───────────────────────────────────────────────────────────────
    if (styleName.startsWith('Debuff_')) {
        const effectKey = 'effect' + styleName.slice('Debuff_'.length);
        const icon = snowprintIcons[effectKey];
        return { color: ABILITY_COLORS.debuff, underline: true, icon: icon?.file, iconAlt: effectKey };
    }

    // ── Buffs ─────────────────────────────────────────────────────────────────
    if (styleName === 'BUFF_no_underscore') {
        return { color: ABILITY_COLORS.buff, underline: true, icon: snowprintIcons.effectBuff?.file, iconAlt: 'Buff' };
    }
    if (styleName.startsWith('Buff_')) {
        const effectKey = 'effect' + styleName.slice('Buff_'.length);
        const icon = snowprintIcons[effectKey];
        return { color: ABILITY_COLORS.buff, underline: true, icon: icon?.file, iconAlt: effectKey };
    }

    // ── Effects ───────────────────────────────────────────────────────────────
    if (styleName === 'Effect_Fire') {
        return { color: ABILITY_COLORS.red, underline: true, icon: snowprintIcons.tileFire?.file, iconAlt: 'Fire' };
    }
    if (styleName === 'Effect_Ice') {
        return { color: ABILITY_COLORS.red, underline: true, icon: snowprintIcons.tileIce?.file, iconAlt: 'Ice' };
    }

    // ── Tiles ─────────────────────────────────────────────────────────────────
    if (styleName.startsWith('Tile_')) {
        const tileMap: Record<string, { key: string; color: string }> = {
            Tile_Contamination: { key: 'tileContaminated', color: ABILITY_COLORS.red },
            Tile_DespoiledGround: { key: 'tileDespoiledGround', color: ABILITY_COLORS.red },
            Tile_Floe: { key: 'tileBrokenIce', color: ABILITY_COLORS.purple },
            Tile_Grass: { key: 'tileGrass', color: ABILITY_COLORS.purple },
            Tile_Trench: { key: 'tileTrench', color: ABILITY_COLORS.purple },
        };
        const entry = tileMap[styleName];
        if (entry) {
            const icon = snowprintIcons[entry.key];
            return { color: entry.color, underline: true, icon: icon?.file, iconAlt: styleName };
        }
    }

    // ── Resources ─────────────────────────────────────────────────────────────
    if (styleName === 'Resource_Gold') {
        return { color: ABILITY_COLORS.buff, icon: snowprintIcons.coins?.file, iconAlt: 'Gold' };
    }
    if (styleName === 'Resource_MachinesOfWarAmmo') {
        return { color: ABILITY_COLORS.buff, icon: snowprintIcons.mowAmmo?.file, iconAlt: 'MoW Ammo' };
    }

    // ── Traits ────────────────────────────────────────────────────────────────
    if (styleName in TRAIT_STYLE_TO_ICON) {
        const iconKey = TRAIT_STYLE_TO_ICON[styleName];
        const color = styleName === 'Decoy' ? ABILITY_COLORS.purple : undefined;
        return traitSpec(iconKey, color);
    }

    // ── Unit types ────────────────────────────────────────────────────────────
    if (styleName === 'Character') {
        return { color: ABILITY_COLORS.purple, icon: snowprintIcons.character?.file, iconAlt: 'Character' };
    }
    if (styleName === 'NonCharacter') {
        return {
            color: ABILITY_COLORS.purple,
            icon: snowprintIcons.character?.file,
            iconAlt: 'Character',
            overrideText: 'Non-Character',
        };
    }
    if (styleName === 'MoW') {
        return { color: ABILITY_COLORS.purple, icon: snowprintIcons.mow?.file, iconAlt: 'MoW' };
    }
    if (styleName === 'Object2') {
        return { color: ABILITY_COLORS.purple, underline: true };
    }
    if (styleName === 'Summon2') {
        return { color: FACTION_COLORS.ThousandSons, icon: snowprintIcons.traitSummon?.file, iconAlt: 'Summon' };
    }

    // ── Game mechanics ────────────────────────────────────────────────────────
    const purpleUnderlineNoIcon = new Set([
        'Charging',
        'Displacement',
        'Healing',
        'NormalAttack',
        'Obliterated',
        'Regenerate',
        'Repairing',
        'FloatingDeath',
        'KEY',
        'Piercing_Ratio',
    ]);
    if (purpleUnderlineNoIcon.has(styleName)) {
        const italic = styleName === 'FloatingDeath';
        const icon = styleName === 'Piercing_Ratio' ? snowprintIcons.piercingDamage?.file : undefined;
        return { color: ABILITY_COLORS.purple, underline: true, italic, icon, iconAlt: 'Piercing' };
    }
    if (styleName === 'Overkill') {
        return {
            color: ABILITY_COLORS.purple,
            underline: true,
            icon: snowprintIcons.overkill?.file,
            iconAlt: 'Overkill',
        };
    }
    if (styleName === 'Cooldown') {
        return { color: ABILITY_COLORS.stat };
    }
    if (styleName === 'HexEffect') {
        return { color: ABILITY_COLORS.red, underline: true };
    }

    // ── Rarity ────────────────────────────────────────────────────────────────
    if (styleName === 'Rarity_Mythic') {
        return { gradient: 'linear-gradient(to bottom, #f97316, #dc2626)' };
    }

    if (styleName === '__italic__') return { italic: true };

    return undefined;
}

// ── i2p (integer-to-plural) preprocessing ────────────────────────────────────

const I2P_PLURAL_MARKER = '[i2p_Plural]';
const I2P_ONE_MARKER = '[i2p_One]';

/** Resolve [i2p_Plural]/[i2p_One] sections by checking the first variable value. */
export function resolveI2p(text: string, level: number, variables: Record<string, (string | number)[]>): string {
    const pluralIndex = text.indexOf(I2P_PLURAL_MARKER);
    if (pluralIndex === -1) return text;
    const oneIndex = text.indexOf(I2P_ONE_MARKER);
    if (oneIndex === -1) return text;

    const prefix = text.slice(0, pluralIndex);
    const pluralContent = text.slice(pluralIndex + I2P_PLURAL_MARKER.length, oneIndex);
    const oneContent = text.slice(oneIndex + I2P_ONE_MARKER.length);

    const variableMatch = /\{\[(\w+)\]\}/.exec(text);
    if (!variableMatch) return prefix + pluralContent;

    const variableName = variableMatch[1];
    const values = variables[variableName];
    const valueAtLevel = Number(values?.[Math.min(level - 1, (values?.length ?? 1) - 1)] ?? 1);
    return prefix + (valueAtLevel === 1 ? oneContent : pluralContent);
}

// ── AST ───────────────────────────────────────────────────────────────────────

export type TextNode = { type: 'text'; value: string };
export type VariableNode = {
    type: 'var';
    name: string;
    /** numeric index for {[varName[0]]} syntax */
    splitIndex?: number;
    /** true for {[UnitName]} */
    isUnitName?: boolean;
};
export type StyledNode = {
    type: 'styled';
    /** resolved style name, or undefined if it's {[DamageProfileTypeStyle]} resolved at render time */
    styleName: string;
    isDynamic: boolean;
    children: AstNode[];
};
export type AstNode = TextNode | VariableNode | StyledNode;

// ── Parser ────────────────────────────────────────────────────────────────────

const TOKEN_RE = /(<style="[^"]*">|<style=\{[^}]+\}>|<\/style>|<i>|<\/i>|\{[^}]+\})/g;

function parseToken(raw: string): { open?: string; isDynamic?: boolean } | { close: true } | { variable: string } {
    if (raw === '</style>' || raw === '</i>') return { close: true };
    if (raw === '<i>') return { open: '__italic__' };
    const openQuoted = /^<style="([^"]*)">\s*$/.exec(raw);
    if (openQuoted) return { open: openQuoted[1] };
    const openDynamic = /^<style=\{([^}]+)\}>\s*$/.exec(raw);
    if (openDynamic) return { open: openDynamic[1], isDynamic: true };
    const variableMatch = /^\{([^}]+)\}$/.exec(raw);
    if (variableMatch) return { variable: variableMatch[1] };
    return { variable: raw };
}

function parseVariableContent(inner: string): VariableNode {
    if (inner === '[UnitName]') return { type: 'var', isUnitName: true, name: 'UnitName' };
    // {[varName[0]]} → splitIndex
    const splitMatch = /^\[(\w+)\[(\d+)\]\]$/.exec(inner);
    if (splitMatch) return { type: 'var', name: splitMatch[1], splitIndex: Number(splitMatch[2]) };
    // {[S/key]} → skip (rendered as empty)
    if (/^\[S\//.test(inner)) return { type: 'var', name: '' };
    // {[varName]} or {[varName_2]} etc.
    const nameMatch = /^\[([^\]]+)\]$/.exec(inner);
    if (nameMatch) return { type: 'var', name: nameMatch[1] };
    return { type: 'var', name: inner };
}

export function parseAbilityText(text: string): AstNode[] {
    const stack: AstNode[][] = [[]];
    const styleStack: Array<{ styleName: string; isDynamic: boolean }> = [];
    let lastIndex = 0;

    for (const match of text.matchAll(TOKEN_RE)) {
        const before = text.slice(lastIndex, match.index);
        if (before) stack.at(-1)!.push({ type: 'text', value: before });
        lastIndex = match.index! + match[0].length;

        const token = parseToken(match[0]);

        if ('close' in token) {
            const children = stack.pop()!;
            const style = styleStack.pop()!;
            const node: StyledNode = { type: 'styled', ...style, children };
            if (stack.length === 0) throw new Error('Unmatched </style> tag in "' + text + '" at index ' + lastIndex);
            stack.at(-1)!.push(node);
        } else if ('open' in token) {
            styleStack.push({ styleName: token.open!, isDynamic: token.isDynamic ?? false });
            stack.push([]);
        } else {
            const variableInner = (token as { variable: string }).variable;
            stack.at(-1)!.push(parseVariableContent(variableInner));
        }
    }

    const trailing = text.slice(lastIndex);
    if (trailing) stack.at(-1)!.push({ type: 'text', value: trailing });

    return stack[0];
}

// ── Rarity scaling ────────────────────────────────────────────────────────────

export const RARITY_FACTOR: Record<Rarity, number> = {
    [Rarity.Common]: 1,
    [Rarity.Uncommon]: 1.2,
    [Rarity.Rare]: 1.4,
    [Rarity.Epic]: 1.6,
    [Rarity.Legendary]: 1.8,
    [Rarity.Mythic]: 2,
};

// ── Variable resolver ─────────────────────────────────────────────────────────

export interface AbilityContext {
    level: number;
    variables: Record<string, (string | number)[]>;
    constants: Record<string, string>;
    /** Variable names that should be multiplied by the rarity factor */
    scaledVariableNames: ReadonlySet<string>;
    rarity: Rarity;
    unitName: string;
    /** faction snowprintId of the character — used for {[UnitName]} coloring */
    factionId: string;
}

export function resolveVariable(node: VariableNode, context: AbilityContext): string | undefined {
    if (node.isUnitName) return context.unitName;
    if (!node.name) return undefined; // S/key → skip

    // Constants are never scaled
    const constantValue = context.constants[node.name];
    if (constantValue !== undefined) {
        if (node.splitIndex !== undefined) {
            return String(constantValue).split(',')[node.splitIndex] ?? '';
        }
        return constantValue;
    }

    const array = context.variables[node.name];
    if (!array) return `{${node.name}}`;
    const rawValue = array[context.level - 1] ?? array.at(-1);
    const string_ = String(rawValue);

    const part = node.splitIndex === undefined ? string_ : (string_.split(',')[node.splitIndex] ?? '');

    if (context.scaledVariableNames.has(node.name)) {
        const numeric = Number(part);
        if (!Number.isNaN(numeric)) {
            return String(Math.round(numeric * RARITY_FACTOR[context.rarity]));
        }
    }

    return part;
}

/** Resolve dynamic style variable (DamageProfileTypeStyle) → actual style name */
export function resolveDynamicStyle(variableContent: string, constants: Record<string, string>): string {
    // varContent is "[DamageProfileTypeStyle]"
    const nameMatch = /^\[([^\]]+)\]$/.exec(variableContent);
    const variableName = nameMatch?.[1] ?? variableContent;
    if (variableName === 'DamageProfileTypeStyle') {
        const profile = constants.damageProfile;
        return profile ? `DMG_${profile}` : 'DMG_Unknown';
    }
    return constants[variableName] ?? variableName;
}
