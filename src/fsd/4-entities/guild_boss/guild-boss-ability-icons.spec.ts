import { describe, expect, it } from 'vitest';

import { abilityIcons } from '@/fsd/5-shared/ui/ability-icons';

import { guildBossData } from './guild-boss.service';

// These 4 abilities have no image asset in the repository at all
const KNOWN_MISSING_ASSETS = new Set(['GuildBossRunAway']);

function getAllBossAbilityIds(): Set<string> {
    const ids = new Set<string>();
    for (const unitSet of Object.values(guildBossData.unitSets)) {
        for (const field of ['activeAbilities', 'passiveAbilities', 'relicAbilities'] as const) {
            for (const id of unitSet[field] ?? []) {
                ids.add(id);
            }
        }
    }
    return ids;
}

describe('guild boss ability icon coverage', () => {
    const abilityIds = getAllBossAbilityIds();

    for (const abilityId of [...abilityIds].toSorted()) {
        if (KNOWN_MISSING_ASSETS.has(abilityId)) continue;

        it(`abilityIcons has an entry for boss ability "${abilityId}"`, () => {
            expect(
                abilityIcons[abilityId as keyof typeof abilityIcons],
                `No icon found for boss ability "${abilityId}". Add an import and entry to src/fsd/5-shared/ui/ability-icons.ts`
            ).toBeDefined();
        });
    }

    it('KNOWN_MISSING_ASSETS list is up to date (no asset exists for these)', () => {
        const stillMissing = [...abilityIds].filter(
            id => !abilityIcons[id as keyof typeof abilityIcons] && !KNOWN_MISSING_ASSETS.has(id)
        );
        expect(stillMissing, 'Found boss abilities with no icon that are not in KNOWN_MISSING_ASSETS').toStrictEqual(
            []
        );
    });
});
