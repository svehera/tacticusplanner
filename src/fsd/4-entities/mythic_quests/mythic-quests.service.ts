/* eslint-disable boundaries/element-types */
import { CharactersService } from '@/fsd/4-entities/character';
import { NpcService } from '@/fsd/4-entities/npc';

import { mythicQuestsData } from './data';
import { IMythicQuest, IMythicQuestTask, IMythicQuestTaskRaw } from './model';
import { parseMythicQuestReward } from './mythic-quest-rewards';

type IMythicQuestsQuestList = (typeof mythicQuestsData.quests)[number]['quests'];

const QUESTS_BY_CHARACTER_ID: Record<string, IMythicQuestsQuestList> = Object.fromEntries(
    mythicQuestsData.quests.map(character => [character.characterId, character.quests])
);

const LANGUAGES_BY_LOCA_KEY: Record<string, string> = Object.fromEntries(
    mythicQuestsData.terms.map(term => [term.Term.replace(/^Quests\//, ''), term.Languages[0] ?? ''])
);

/** Resolves a `heroId` task parameter (usually the character themself, but sometimes a summoned
 *  NPC/unit) to a display name for the `{[HERO_NAME]}` placeholder. */
function resolveHeroName(heroId: string): string {
    return CharactersService.charactersBySnowprintId[heroId]?.name ?? NpcService.getNpcById(heroId)?.name ?? heroId;
}

/** Converts a `taskParameters` key like `damageProfileType` to the `{[VAR_NAME]}` placeholder form
 *  used in the loca templates, e.g. `DAMAGE_PROFILE_TYPE`. */
function camelToUpperSnake(key: string): string {
    return key.replaceAll(/([a-z0-9])([A-Z])/g, '$1_$2').toUpperCase();
}

function buildVariables(task: IMythicQuestTaskRaw): Record<string, (string | number)[]> {
    const variables: Record<string, (string | number)[]> = { TARGET_AMOUNT: [task.target] };
    for (const [key, value] of Object.entries(task.taskParameters)) {
        if (key === 'heroId') {
            variables.HERO_NAME = [resolveHeroName(value)];
            continue;
        }
        variables[camelToUpperSnake(key)] = [value];
    }
    return variables;
}

function buildTask(task: IMythicQuestTaskRaw): IMythicQuestTask {
    return {
        name: task.name,
        target: task.target,
        parameters: task.taskParameters,
        variables: buildVariables(task),
        languages: LANGUAGES_BY_LOCA_KEY[task.locaKey] ?? '',
    };
}

export class MythicQuestsService {
    /** @returns the structured rewards and tasks for a character's mythic quest at `questIndex`
     *  (0-4, corresponding to quests 1-5), or `undefined` if the character has no mythic quests
     *  or `questIndex` is out of range. */
    public static getQuest(characterSnowprintId: string, questIndex: number): IMythicQuest | undefined {
        if (questIndex < 0 || questIndex >= 5) return undefined;

        const quests = QUESTS_BY_CHARACTER_ID[characterSnowprintId];
        const raw = quests?.find(quest => quest.number === questIndex + 1);
        if (!raw) return undefined;

        return {
            rewards: raw.rewards.map(reward => parseMythicQuestReward(reward)),
            tasks: raw.tasks.map(task => buildTask(task)),
        };
    }
}
