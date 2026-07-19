/* eslint-disable boundaries/element-types */
import { describe, expect, it } from 'vitest';

import { CharactersService } from '@/fsd/4-entities/character';

import { parseMythicQuestReward } from './mythic-quest-rewards';
import { MythicQuestsService } from './mythic-quests.service';

describe('MythicQuestsService.getQuest', () => {
    it('resolves task variables and languages for a normal task', () => {
        const quest = MythicQuestsService.getQuest('blackAbaddon', 0);

        expect(quest).toBeDefined();
        expect(quest?.tasks).toHaveLength(1);

        const [task] = quest!.tasks;
        expect(task.name).toBe('SlayEnemiesWithHeroToTraitInOneBattle');
        expect(task.parameters).toEqual({ trait: 'Emplacement', heroId: 'blackAbaddon', killAmount: '8' });
        expect(task.variables.KILL_AMOUNT).toEqual(['8']);
        expect(task.variables.TRAIT).toEqual(['Emplacement']);
        expect(task.variables.HERO_NAME).toEqual(['Abaddon']);
        expect(task.languages).toContain('{[KILL_AMOUNT]}');
    });

    it('returns every task for a multi-task quest', () => {
        const quest = MythicQuestsService.getQuest('blackAbaddon', 4);

        expect(quest?.tasks).toHaveLength(3);
    });

    it('resolves HERO_NAME from an NPC when heroId is not the owning character', () => {
        const quest = MythicQuestsService.getQuest('votanMemnyr', 1);

        expect(quest).toBeDefined();
        const npcTask = quest!.tasks.find(task => task.parameters.heroId === 'votanNpc2Steeljack');
        expect(npcTask).toBeDefined();
        expect(npcTask!.variables.HERO_NAME?.[0]).not.toBe('votanNpc2Steeljack');
    });

    it('returns undefined for an out-of-range quest index', () => {
        expect(MythicQuestsService.getQuest('blackAbaddon', 5)).toBeUndefined();
        expect(MythicQuestsService.getQuest('blackAbaddon', -1)).toBeUndefined();
    });

    it('returns undefined for a character with no mythic quests', () => {
        expect(MythicQuestsService.getQuest('notARealCharacterId', 0)).toBeUndefined();
    });

    it('has all five mythic quests for every playable character', () => {
        for (const characterId of Object.keys(CharactersService.charactersBySnowprintId)) {
            for (let questIndex = 0; questIndex < 5; questIndex++) {
                expect(
                    MythicQuestsService.getQuest(characterId, questIndex),
                    `${characterId} quest ${questIndex}`
                ).toBeDefined();
            }
        }
    });
});

describe('parseMythicQuestReward', () => {
    it('parses character mythic shards', () => {
        const reward = parseMythicQuestReward('mythicShards_blackAbaddon:4');
        expect(reward.icon).toEqual({ kind: 'shard', characterId: 'blackAbaddon' });
        expect(reward.quantity).toBe(4);
    });

    it('parses a hero ascension orb', () => {
        const reward = parseMythicQuestReward('heroAscensionOrbMythic_Chaos:2');
        expect(reward.icon).toEqual({ kind: 'ascensionOrb', alliance: 'Chaos' });
        expect(reward.quantity).toBe(2);
    });

    it('parses an ability token', () => {
        const reward = parseMythicQuestReward('abilityTokenMythic_Chaos:5');
        expect(reward.icon).toEqual({ kind: 'abilityToken', alliance: 'Chaos' });
        expect(reward.quantity).toBe(5);
    });

    it('parses mythic xp', () => {
        const reward = parseMythicQuestReward('xpMythic:1');
        expect(reward.icon).toEqual({ kind: 'xp' });
        expect(reward.quantity).toBe(1);
    });

    it('parses gold', () => {
        const reward = parseMythicQuestReward('gold:250000');
        expect(reward.icon).toEqual({ kind: 'gold' });
        expect(reward.quantity).toBe(250_000);
    });

    it('parses a bare equipment reward with no quantity suffix', () => {
        const reward = parseMythicQuestReward('I_Crit_M006');
        expect(reward.icon).toEqual({ kind: 'equipment', equipmentId: 'I_Crit_M006' });
        expect(reward.quantity).toBeUndefined();
    });

    it('falls back to unknown for unrecognized reward strings', () => {
        const reward = parseMythicQuestReward('someBrandNewRewardType:3');
        expect(reward.icon).toEqual({ kind: 'unknown', raw: 'someBrandNewRewardType' });
        expect(reward.quantity).toBe(3);
    });
});
