/* eslint-disable import-x/no-internal-modules */
import { factionLookup } from '@/fsd/5-shared/lib';
import { Rarity } from '@/fsd/5-shared/model';

import { CharactersService } from '@/fsd/4-entities/character';
import { MowsService } from '@/fsd/4-entities/mow';
import type { IMissionTask } from '@/fsd/4-entities/shops';

import { AbilityText } from '@/fsd/3-features/character-details/ability-text-renderer';

const ALLIANCE_VALUES = new Set(['Imperial', 'Xenos', 'Chaos']);

/** Raw `taskParameters.trait`/`factionTrait` value -> exact `TRAIT_STYLE_TO_ICON` key in ability-text.ts. */
const TRAIT_VALUE_TO_STYLE: Record<string, string> = {
    HeavyWeapon: 'Heavy_Weapon',
    TeleportStrike: 'Teleport_Strike_short',
    Resilient: 'Resilient',
    IndirectFire: 'Indirect_Fire',
    LivingMetal: 'Living_Metal',
    MkGravis: 'Mk_Gravis',
    SuppressiveFire: 'Suppressive_Fire',
    TerminatorArmor: 'Terminator_Armor',
    ActOfFaith: 'Act_Of_Faith',
    BattleFatigue: 'Battle_Fatigue',
    BigTarget: 'Big_Target',
};

const GAME_MODE_LABELS: Record<string, string> = {
    Survival: 'survival',
    LinearHeroEvent: 'quest',
    PvP: 'Arena',
    Waves: 'Onslaught',
    SyncPVP: 'Tournament Arena',
    CampaignEvent: 'campaigns',
    AllCampaigns: 'campaigns',
    GuildWars: 'Guild Wars',
};

const PLAY_BATTLES_SENTENCE: Record<string, string> = {
    Survival: 'Play {target} <style="Resource_SurvivalToken">survival</style> battles.',
    LinearHeroEvent: 'Play {target} quest battles.',
    PvP: 'Play {target} <style="Resource_ArenaToken">Arena</style> matches.',
    Waves: 'Play {target} <style="Resource_OnslaughtToken">Onslaught</style> battles.',
    SyncPVP: 'Play {target} matches in Tournament Arena.',
    AllCampaigns: 'Play {target} campaign battles.',
    GuildWars: 'Play {target} battles in Guild Wars.',
};

/** Raw `damageProfileType` value -> in-game display name, for cases where they diverge (e.g. Gauss is shown as "Molecular"). */
const DAMAGE_TYPE_DISPLAY_OVERRIDE: Record<string, string> = {
    Gauss: 'Molecular',
};

/** "HeavyWeapon" -> "Heavy Weapon" fallback label for trait values without an explicit style mapping. */
function humanizeTraitValue(value: string): string {
    return value.replaceAll(/([a-z0-9])([A-Z])/g, '$1 $2');
}

function resolveTrait(value: string): { style: string; label: string } {
    return { style: TRAIT_VALUE_TO_STYLE[value] ?? value, label: humanizeTraitValue(value) };
}

/** `factionTrait` is sometimes an Alliance (Imperial/Xenos/Chaos), sometimes a single-faction trait. */
function resolveAllianceOrTrait(value: string): { style: string; label: string } {
    if (ALLIANCE_VALUES.has(value)) return { style: `Aliance_${value}`, label: value };
    return resolveTrait(value);
}

function resolveFaction(factionId: string): { style: string; label: string } {
    const lookup = factionLookup as Record<string, { name: string } | undefined>;
    return { style: `Faction_${factionId}`, label: lookup[factionId]?.name ?? factionId };
}

function resolveHero(heroId: string): { style?: string; label: string } {
    const character = CharactersService.charactersBySnowprintId[heroId];
    if (character) return { style: `Faction_${character.faction}`, label: character.name };
    const mow = MowsService.resolveToStatic(heroId);
    if (mow) return { style: `Faction_${mow.faction}`, label: mow.name };
    return { label: heroId };
}

function parameter(task: IMissionTask, key: string): string {
    const value = task.taskParameters?.[key];
    return typeof value === 'string' ? value : '';
}

function parameterList(task: IMissionTask, key: string): string[] {
    const value = task.taskParameters?.[key];
    return Array.isArray(value) ? value : [];
}

function joinModes(modes: string[]): string {
    const labels = modes.map(m => GAME_MODE_LABELS[m] ?? m);
    if (labels.length <= 1) return labels[0] ?? '';
    if (labels.length === 2) return `${labels[0]} or ${labels[1]}`;
    return `${labels.slice(0, -1).join(', ')}, or ${labels.at(-1)}`;
}

interface TaskContent {
    text: string;
    variables: Record<string, (string | number)[]>;
    constants: Record<string, string>;
}

const TASK_BUILDERS: Record<string, (task: IMissionTask) => TaskContent> = {
    ApplyUpgrades: () => plain('Apply {target} upgrades to your characters or machines of war.'),
    AttackUnitsInGameModes: task =>
        plain('Attack {target} times in {modes}.', { modes: [joinModes(parameterList(task, 'gameModes'))] }),
    DealAbilityDamage: () => plain('Deal {target} <style="Stat_Damage">damage</style> with abilities.'),
    DealDamageInGameModes: task =>
        plain('Deal {target} <style="Stat_Damage">damage</style> in {modes}.', {
            modes: [joinModes(parameterList(task, 'gameModes'))],
        }),
    DealDamageOfProfileType: task =>
        damageProfileSentence(
            task,
            'Deal {target} <style={[DmgStyle]}>{damageProfileType}</style> <style="Stat_Damage">damage</style>.'
        ),
    DealDamage: () => plain('Deal {target} <style="Stat_Damage">damage</style>.'),
    DefeatWaves: () => plain('Defeat {target} waves of enemies in any wave-based game mode.'),
    HealHealth: () => plain('Heal {target} health.'),
    OpenChests: task => plain(`Open {target} ${task.target > 1 ? 'chests' : 'chest'}.`),
    Overkill: () => plain('<style="Overkill">Overkill</style> {target} enemies.'),
    PlayBattlesInGameMode: task => {
        const mode = parameter(task, 'gameMode');
        return plain(PLAY_BATTLES_SENTENCE[mode] ?? 'Play {target} battles.');
    },
    ScoreBlocks: () => plain('Score {target} <style="Stat_Block">blocks</style>.'),
    ScoreCritsInGameModes: task =>
        plain('Score {target} <style="Stat_Crit">crits</style> in {modes}.', {
            modes: [joinModes(parameterList(task, 'gameModes'))],
        }),
    ScoreCrits: () => plain('Score {target} <style="Stat_Crit">crits</style> in any game mode.'),
    ScoreHitsInGameModes: task =>
        plain('Score {target} <style="Stat_Hits">hits</style> in {modes}.', {
            modes: [joinModes(parameterList(task, 'gameModes'))],
        }),
    SlayEnemiesFromHigherElevation: () => plain('Defeat {target} enemies from a higher elevation.'),
    SlayEnemiesOfFactionTrait: task =>
        allianceOrTraitSentence(
            task,
            'Defeat {target} enemies of the <style={[AotStyle]}>{aotLabel}</style> Alliance.',
            'Defeat {target} <style={[AotStyle]}>{aotLabel}</style> enemies.'
        ),
    SlayEnemiesOfFaction: task =>
        factionSentence(task, 'Defeat {target} <style={[FactionStyle]}>{factionName}</style> enemies.'),
    SlayEnemiesWithDamageProfile: task =>
        damageProfileSentence(
            task,
            'Defeat {target} enemies with <style={[DmgStyle]}>{damageProfileType}</style> <style="Stat_Damage">damage</style>.'
        ),
    SlayEnemiesWithFactionTrait: task =>
        allianceOrTraitSentence(
            task,
            'Defeat {target} enemies with <style={[AotStyle]}>{aotLabel}</style> units.',
            'Defeat {target} enemies with <style={[AotStyle]}>{aotLabel}</style> units.'
        ),
    SlayEnemiesWithFaction: task =>
        factionSentence(task, 'Defeat {target} enemies with <style={[FactionStyle]}>{factionName}</style> units.'),
    SlayEnemiesWithMeleeAttacks: () => plain('Defeat {target} enemies with melee attacks.'),
    SlayEnemiesWithRangedAttacks: () => plain('Defeat {target} enemies with ranged attacks.'),
    SlayEnemiesWithTrait: task =>
        traitSentence(task, 'Defeat {target} enemies with <style={[TraitStyle]}>{traitLabel}</style> units.'),
    SlayEnemies: () => plain('Defeat {target} enemies.'),
    SpendStamina: () => plain('Spend {target} <style="Resource_Stamina">energy</style>.'),
    Summon: () => plain('<style="Summon">Summon</style> {target} units.'),
    TraverseHexes: () => plain('Traverse {target} hexes with your characters.'),
    UpgradeAbility: () => plain('Upgrade {target} abilities of your characters or machines of war.'),
    UseAbilityWithFactionTrait: task =>
        allianceOrTraitSentence(
            task,
            'Use {target} abilities with <style={[AotStyle]}>{aotLabel}</style> units.',
            'Use {target} abilities with <style={[AotStyle]}>{aotLabel}</style> units.'
        ),
    UseAbilityWithFaction: task =>
        factionSentence(task, 'Use {target} abilities with <style={[FactionStyle]}>{factionName}</style> units.'),
    UseAbility: () => plain('Use {target} active abilities with your units.'),
    WinBattlesWithFactionTraitLineup: task =>
        allianceOrTraitSentence(
            task,
            'Win {target} battles using only <style={[AotStyle]}>{aotLabel}</style> characters.',
            'Win {target} battles using only <style={[AotStyle]}>{aotLabel}</style> characters.'
        ),
    WinBattlesWithHero: task => {
        const heroId = parameter(task, 'heroId');
        const hero = resolveHero(heroId);
        return {
            text: hero.style
                ? 'Win {target} battles with <style={[HeroStyle]}>{heroName}</style> deployed and surviving the battle.'
                : 'Win {target} battles with {heroName} deployed and surviving the battle.',
            variables: { target: [task.target], heroName: [hero.label] },
            constants: { HeroStyle: hero.style ?? '' },
        };
    },
    WinBattlesWithoutDamageProfile: task =>
        damageProfileSentence(
            task,
            'Win {target} battles without using any characters that deal <style={[DmgStyle]}>{damageProfileType}</style> <style="Stat_Damage">damage</style>.'
        ),
    WinBattlesWithoutUsingSummons: () => plain('Win {target} battles without summoning any units.'),
    WinCampaignBattles: () => plain('Win {target} campaign battles.'),
};

function plain(text: string, extraVariables: Record<string, (string | number)[]> = {}): TaskContent {
    return { text, variables: extraVariables, constants: {} };
}

function damageProfileSentence(task: IMissionTask, text: string): TaskContent {
    const value = parameter(task, 'damageProfileType');
    const label = DAMAGE_TYPE_DISPLAY_OVERRIDE[value] ?? value;
    return {
        text,
        variables: { target: [task.target], damageProfileType: [label] },
        constants: { DmgStyle: `DMG_${value}` },
    };
}

function factionSentence(task: IMissionTask, text: string): TaskContent {
    const factionId = parameter(task, 'factionId');
    const { style, label } = resolveFaction(factionId);
    return {
        text,
        variables: { target: [task.target], factionName: [label] },
        constants: { FactionStyle: style },
    };
}

function traitSentence(task: IMissionTask, text: string): TaskContent {
    const value = parameter(task, 'trait');
    const { style, label } = resolveTrait(value);
    return {
        text,
        variables: { target: [task.target], traitLabel: [label] },
        constants: { TraitStyle: style },
    };
}

function allianceOrTraitSentence(task: IMissionTask, allianceText: string, traitText: string): TaskContent {
    const value = parameter(task, 'factionTrait');
    const { style, label } = resolveAllianceOrTrait(value);
    const isAlliance = ALLIANCE_VALUES.has(value);
    return {
        text: isAlliance ? allianceText : traitText,
        variables: { target: [task.target], aotLabel: [label] },
        constants: { AotStyle: style },
    };
}

/**
 * Renders one mission task's description. Templates are hand-authored (no source strings exist
 * for these locaKeys anywhere in the extracted data) using the same `<style="X">{var}</style>`
 * syntax as character ability text, so the existing `AbilityText` renderer/parser can be reused
 * as-is. Falls back to a generic "name — target" line for any task name not yet covered.
 */
export function MissionTaskText({ task }: { task: IMissionTask }) {
    const builder = TASK_BUILDERS[task.name];
    const content = builder
        ? builder(task)
        : plain(`${task.name.replaceAll(/([a-z0-9])([A-Z])/g, '$1 $2')} — {target}`);
    const variables = { ...content.variables, target: [task.target] };

    return (
        <AbilityText
            text={content.text}
            level={1}
            variables={variables}
            constants={content.constants}
            scaledVariableNames={[]}
            rarity={Rarity.Common}
            unitName=""
            factionId=""
        />
    );
}
