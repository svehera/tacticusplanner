/* eslint-disable import-x/no-internal-modules */
import { describe, expect, it } from 'vitest';

import questJson from './data/hero-quests.json';
import { getQuestMapUrl } from './quest-maps';

describe('quest maps', () => {
    it('every quest battle has a boardId with an extracted map image', () => {
        const missing = questJson.flatMap(quest =>
            quest.tiers.flatMap(tier =>
                tier.battles
                    .filter(battle => !battle.boardId || !getQuestMapUrl(battle.boardId))
                    .map(battle => `${quest.unitId} battle ${battle.battleNr}: ${battle.boardId ?? '(no boardId)'}`)
            )
        );
        expect(missing, `Quest battles missing a map image:\n${missing.join('\n')}`).toHaveLength(0);
    });
});
