import { factionLookup } from '@/fsd/5-shared/lib';
import { FactionId, Trait } from '@/fsd/5-shared/model';

import type { IChestMilestone, ILegendaryEventStatic, IPointsMilestone, LreTrackId } from '../static-data.model';

import type { ILreEventDates } from './lre-event-dates';

interface INewPointsMilestone {
    requiredProgress: number;
    chestRewardId: string;
}

interface INewChest {
    level: number;
    cost: { type: string; amount: number };
}

interface INewTaskParameters {
    factionId?: string;
    factionTrait?: string;
    damageProfileType?: string;
    trait?: string;
}

interface INewTask {
    name: string;
    target: number;
    taskParameters?: INewTaskParameters;
}

interface INewQuest {
    tasks: INewTask[];
}

export interface INewCharacterJson {
    id: string;
    unitSnowprintId: string;
    name: string;
    eventStage: number;
    lanes: Record<LreTrackId, { factionId: string }>;
    pointsMilestones: INewPointsMilestone[];
    chests: INewChest[];
    shardsPerChest: number;
    progression: {
        unlock: number;
        fourStars: number;
        fiveStars: number;
        blueStar: number;
        twoBlueStars: number;
        mythic: number;
    };
    quests: { regular: INewQuest[]; premium: INewQuest[] };
}

export interface INewBonusObjective {
    type: string;
    target: string;
    points: number;
}

export interface INewBattleTrack {
    battlesPoints: readonly number[];
    killPoints: number;
    disallowedFactions: readonly string[];
    bonusObjectives: readonly INewBonusObjective[];
}

export interface INewBattleJson {
    id: string;
    alpha: INewBattleTrack;
    beta: INewBattleTrack;
    gamma: INewBattleTrack;
}

export function toLegacyPointsMilestones(milestones: INewPointsMilestone[]): IPointsMilestone[] {
    return milestones.map((m, index) => ({
        milestone: index + 1,
        cumulativePoints: m.requiredProgress,
        engramPayout: Number(m.chestRewardId.split(':')[1]),
    }));
}

export function toLegacyChestMilestones(chests: INewChest[]): IChestMilestone[] {
    return chests.map(c => ({ chestLevel: c.level, engramCost: c.cost.amount }));
}

function factionName(factionId: string): string {
    return factionLookup[factionId as FactionId]?.name ?? factionId;
}

export function buildTrackEnemies(factionId: string): { label: string } {
    return { label: factionName(factionId) };
}

const factionsByAlliance: Record<string, Set<string>> = {};
for (const faction of Object.values(factionLookup)) {
    (factionsByAlliance[faction.alliance] ??= new Set()).add(faction.snowprintId);
}

function setsEqual(a: Set<string>, b: Set<string>): boolean {
    return a.size === b.size && [...a].every(x => b.has(x));
}

/**
 * Reproduces the old hand-typed track names ("Alpha (No Xenos)", "Beta (No Chaos or
 * Tyranids)") from `disallowedFactions`, which is always either exactly one
 * alliance's full faction roster, or that roster plus 1-2 extra factions.
 */
export function buildTrackName(section: LreTrackId, disallowedFactions: readonly string[]): string {
    const label = section.charAt(0).toUpperCase() + section.slice(1);
    const disallowedSet = new Set(disallowedFactions);

    for (const [alliance, roster] of Object.entries(factionsByAlliance)) {
        if (setsEqual(disallowedSet, roster)) {
            return `${label} (No ${alliance})`;
        }
        const missing = [...roster].filter(f => !disallowedSet.has(f));
        const extra = [...disallowedSet].filter(f => !roster.has(f));
        if (missing.length === 0 && extra.length > 0 && extra.length <= 2) {
            const extraNames = extra.map(f => factionName(f)).join(' or ');
            return `${label} (No ${alliance} or ${extraNames})`;
        }
    }

    return label;
}

/** Faction display names used in quest text differ from `factionLookup`'s canonical
 * names for a couple of factions (verified against the old files' mission text). */
const MISSION_FACTION_NAME_OVERRIDES: Partial<Record<string, string>> = {
    AdeptusMechanicus: 'AdMechs',
    Tau: "T'au",
};

function missionFactionName(factionId: string | undefined): string {
    if (!factionId) return '';
    return MISSION_FACTION_NAME_OVERRIDES[factionId] ?? factionName(factionId);
}

function taskText(task: INewTask): string {
    const p = task.taskParameters ?? {};
    switch (task.name) {
        case 'DefeatWaves': {
            return `Defeat ${task.target} waves of enemies in any wave-based game mode`;
        }
        case 'DealDamage': {
            return `Deal ${task.target} damage`;
        }
        case 'DealAbilityDamage': {
            return `Deal ${task.target / 1000}k damage with Abilities`;
        }
        case 'DealDamageOfProfileType': {
            return `Deal ${task.target / 1000}k ${p.damageProfileType} damage`;
        }
        case 'SlayEnemiesOfFaction': {
            return `Defeat ${task.target} ${missionFactionName(p.factionId)}`;
        }
        case 'UseAbilityWithFactionTrait': {
            return `Use abilities ${task.target} times with ${p.factionTrait} units`;
        }
        case 'WinBattlesWithoutUsingSummons': {
            return `Win ${task.target} battle${task.target === 1 ? '' : 's'} without Summoning any units`;
        }
        case 'SlayEnemiesWithFactionTrait': {
            return `Defeat ${task.target} enemies with ${p.factionTrait} units`;
        }
        case 'WinBattlesWithoutTrait': {
            return `Win ${task.target} battle${task.target === 1 ? '' : 's'} without deploying any ${Trait[p.trait as keyof typeof Trait]} characters`;
        }
        case 'SlayEnemiesWithDamageProfile': {
            return `Defeat ${task.target} enemies with ${p.damageProfileType} Damage`;
        }
        default: {
            throw new Error(`Unhandled LRE quest task: ${task.name}`);
        }
    }
}

export function questsToMissionText(quests: INewQuest[]): string[] {
    return quests.map(q => q.tasks.map(task => taskText(task)).join(', '));
}

export function buildStaticLegendaryEvent(
    characterJson: INewCharacterJson,
    battleJson: INewBattleJson,
    dates: ILreEventDates
): ILegendaryEventStatic {
    const id = Number(characterJson.id);
    const trackStatic = (section: LreTrackId) => ({
        name: buildTrackName(section, battleJson[section].disallowedFactions),
        killPoints: battleJson[section].killPoints,
        battlesPoints: battleJson[section].battlesPoints,
        enemies: buildTrackEnemies(characterJson.lanes[section].factionId),
    });

    return {
        id,
        unitSnowprintId: characterJson.unitSnowprintId,
        name: characterJson.name,
        wikiLink: '',
        eventStage: characterJson.eventStage,
        finished: dates.finished,
        nextEventDate: dates.nextEventDate,
        nextEventDateUtc: dates.nextEventDateUtc,
        regularMissions: questsToMissionText(characterJson.quests.regular),
        premiumMissions: questsToMissionText(characterJson.quests.premium),
        alpha: trackStatic('alpha'),
        beta: trackStatic('beta'),
        gamma: trackStatic('gamma'),
        pointsMilestones: toLegacyPointsMilestones(characterJson.pointsMilestones),
        chestsMilestones: toLegacyChestMilestones(characterJson.chests),
        shardsPerChest: characterJson.shardsPerChest,
        battlesCount: battleJson.alpha.battlesPoints.length,
        constraintsCount: 5,
        progression: characterJson.progression,
    };
}
