import { describe, expect, it } from 'vitest';

import { rawLreBattleData } from '@/fsd/4-entities/lre';

import { getLeMapUrl } from './le-maps';

describe('legendary event maps', () => {
    it('every legendary event battle has a map image', () => {
        const missing = new Set<string>();
        let checked = 0;
        for (const event of rawLreBattleData.legendaryEvents) {
            for (const track of [event.alpha, event.beta, event.gamma]) {
                for (const battle of track.battles) {
                    checked++;
                    if (!getLeMapUrl(battle.mapId)) missing.add(`event ${event.id}: ${battle.mapId}`);
                }
            }
        }
        expect(checked).toBeGreaterThan(0);
        expect([...missing], `Battles missing a map image:\n${[...missing].join('\n')}`).toHaveLength(0);
    });
});
