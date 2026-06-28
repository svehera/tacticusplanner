/* eslint-disable import-x/no-internal-modules */
import { describe, expect, it } from 'vitest';

import { tacticusIcons } from '@/fsd/5-shared/ui/icons/icon-list';

import characterData2Json from '@/fsd/4-entities/character/data/new-character-data2.json';

interface AttackProfile {
    hitCount: number;
    pierce: string;
    range?: number;
}

interface CharData2Entry {
    id: string;
    name: string;
    meleeAttack: AttackProfile;
    rangedAttack?: AttackProfile;
}

const characterData2 = characterData2Json as unknown as CharData2Entry[];

const pierceTypeToCharacters = new Map<string, string[]>();
for (const char of characterData2) {
    for (const pierce of [char.meleeAttack.pierce, char.rangedAttack?.pierce].filter(Boolean) as string[]) {
        if (!pierceTypeToCharacters.has(pierce)) {
            pierceTypeToCharacters.set(pierce, []);
        }
        pierceTypeToCharacters.get(pierce)!.push(char.name);
    }
}

describe('new-character-data2.json damage type icon coverage', () => {
    for (const [pierce, characters] of pierceTypeToCharacters) {
        it(`tacticusIcons has an icon for pierce type "${pierce}" (used by: ${characters.slice(0, 3).join(', ')}${characters.length > 3 ? '…' : ''})`, () => {
            const key = `damage${pierce}`;
            expect(
                tacticusIcons[key],
                `No icon found for pierce type "${pierce}". Add key "${key}" to tacticusIcons in src/fsd/5-shared/ui/icons/icon-list.ts`
            ).toBeDefined();
        });
    }
});
