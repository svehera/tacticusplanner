import { describe, expect, it } from 'vitest';

import { resolveFieldEnemyNpcData } from './guild-boss-npc-adapter';
import { getFieldEnemies, guildBossData } from './guild-boss.service';

function allFieldEnemyIds(): string[] {
    const ids = new Set<string>();
    for (const config of Object.values(guildBossData.guildBossSeasonDataConfigsGDTO)) {
        for (const tier of config.tiers) {
            for (const set of tier.sets) {
                for (const encounter of set.encounters) {
                    for (const id of getFieldEnemies(encounter)) ids.add(id);
                }
            }
        }
    }
    return [...ids];
}

describe('guild boss npc adapter', () => {
    it('every battlefield enemy resolves to NPC data', () => {
        const missing: string[] = [];
        for (const rawEnemyId of allFieldEnemyIds()) {
            const resolved = resolveFieldEnemyNpcData(rawEnemyId);
            if (!resolved) missing.push(rawEnemyId);
        }
        expect(missing, 'battlefield enemies with no resolvable NPC data').toStrictEqual([]);
    });
});
