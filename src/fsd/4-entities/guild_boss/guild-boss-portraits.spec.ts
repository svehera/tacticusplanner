import { describe, expect, it } from 'vitest';

import { bossPortraitMap } from './guild-boss-portraits';
import { guildBossData, resolvePrimePortraitPath, resolvePrimeRegularPortraitPath } from './guild-boss.service';

const ENCOUNTER_UNIT_RE = /^GuildBoss\d+(?:Boss|MiniBoss|Minion)\d/;

describe('guild boss portraits', () => {
    it('every boss and prime unit set has a resolvable portrait', () => {
        const missing: string[] = [];
        for (const [unitSetId, unitSet] of Object.entries(guildBossData.unitSets)) {
            if (!ENCOUNTER_UNIT_RE.test(unitSetId)) continue;
            const isBoss = /^GuildBoss\d+Boss\d/.test(unitSetId);
            const found = isBoss
                ? (bossPortraitMap[unitSetId] ?? resolvePrimePortraitPath(unitSetId))
                : (resolvePrimeRegularPortraitPath(unitSetId, unitSet.questUnitId) ??
                  resolvePrimePortraitPath(unitSetId));
            if (!found) missing.push(unitSetId);
        }
        expect(missing, 'Unit sets with no resolvable portrait').toStrictEqual([]);
    });
});
