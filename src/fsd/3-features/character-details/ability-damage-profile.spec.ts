/* eslint-disable import-x/no-internal-modules */
import { describe, expect, it } from 'vitest';

import abilityDataJson from '@/fsd/4-entities/abilities/data/new-ability-data.json';

interface AbilityEntry {
    id: string;
    text: {
        name: string;
        currentLevelDescription: string;
        nextLevelDescription: string;
    };
    constants?: Record<string, string>;
}

const abilityData = abilityDataJson as unknown as AbilityEntry[];

describe('ability DamageProfileTypeStyle requires damageProfile constant', () => {
    for (const ability of abilityData) {
        const usesDynamicStyle = [ability.text.currentLevelDescription, ability.text.nextLevelDescription].some(text =>
            text.includes('DamageProfileTypeStyle')
        );

        if (!usesDynamicStyle) continue;

        it(`${ability.id} ("${ability.text.name}") defines constants.damageProfile`, () => {
            expect(
                ability.constants?.damageProfile,
                `Ability "${ability.text.name}" uses {[DamageProfileTypeStyle]} but is missing constants.damageProfile`
            ).toBeDefined();
        });
    }
});
