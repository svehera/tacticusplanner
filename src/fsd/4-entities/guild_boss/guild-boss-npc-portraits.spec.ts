import { describe, expect, it } from 'vitest';

import { guildBossData, resolveNpcUnitPortraitPath } from './guild-boss.service';

describe('guild boss npc portraits', () => {
    it('every unitAmountDecrease modifier subtarget resolves to a portrait', () => {
        const missing: string[] = [];
        for (const [key, modifierDefinition] of Object.entries(guildBossData.modifiers)) {
            if (modifierDefinition.type !== 'unitAmountDecrease') continue;
            const subtargets = modifierDefinition.subtargets ?? modifierDefinition.subtarget?.split(',') ?? [];
            for (const unitSetId of subtargets) {
                const path = resolveNpcUnitPortraitPath(unitSetId);
                if (!path) missing.push(`${key} → ${unitSetId}`);
            }
        }
        expect(missing, 'unitAmountDecrease subtargets with no portrait').toStrictEqual([]);
    });
});
