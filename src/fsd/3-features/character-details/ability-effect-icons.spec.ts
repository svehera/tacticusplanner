/* eslint-disable import-x/no-internal-modules */
import { describe, expect, it } from 'vitest';

import { snowprintIcons } from '@/fsd/5-shared/assets';

import abilityDataJson from '@/fsd/4-entities/abilities/data/new-ability-data.json';

interface AbilityEntry {
    id: string;
    text: {
        currentLevelDescription: string;
        nextLevelDescription: string;
    };
}

const abilityData = abilityDataJson as unknown as AbilityEntry[];

const effectStylePattern = /<style="(Debuff_[^"]+|Buff_[^"]+|BUFF_[^"]+|Effect_[^"]+|Tile_[^"]+)">/g;

// Explicit overrides for styles whose icon key doesn't follow the default pattern
const EFFECT_STYLE_TO_KEY: Record<string, string> = {
    BUFF_no_underscore: 'effectBuff',
    Effect_Fire: 'tileFire',
    Effect_Ice: 'tileIce',
    Tile_Contamination: 'tileContaminated',
    Tile_Floe: 'tileBrokenIce',
};

function effectStyleToKey(style: string): string {
    if (style in EFFECT_STYLE_TO_KEY) return EFFECT_STYLE_TO_KEY[style];
    // Debuff_Stunned -> effectStunned, Buff_Shield -> effectShield, Tile_Grass -> tileGrass
    return style.replace(/^(?:Debuff|Buff|Effect)_/, 'effect').replace(/^Tile_/, 'tile');
}

const effectTypeToAbilities = new Map<string, string[]>();
for (const ability of abilityData) {
    for (const text of [ability.text.currentLevelDescription, ability.text.nextLevelDescription]) {
        for (const match of text.matchAll(effectStylePattern)) {
            const styleType = match[1];
            if (!effectTypeToAbilities.has(styleType)) {
                effectTypeToAbilities.set(styleType, []);
            }
            if (!effectTypeToAbilities.get(styleType)!.includes(ability.id)) {
                effectTypeToAbilities.get(styleType)!.push(ability.id);
            }
        }
    }
}

describe('ability effect icon coverage', () => {
    for (const [styleType, abilityIds] of effectTypeToAbilities) {
        const effectKey = effectStyleToKey(styleType);
        it(`snowprintIcons has "${effectKey}" for style "${styleType}" (used in: ${abilityIds.slice(0, 3).join(', ')}${abilityIds.length > 3 ? '…' : ''})`, () => {
            expect(
                snowprintIcons[effectKey],
                `No icon found for style "${styleType}". Add key "${effectKey}" to snowprintIcons in src/fsd/5-shared/assets.ts`
            ).toBeDefined();
        });
    }
});
