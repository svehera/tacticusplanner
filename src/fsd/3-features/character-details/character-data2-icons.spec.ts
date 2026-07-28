/* eslint-disable import-x/no-internal-modules */
import { describe, expect, it } from 'vitest';

import { tacticusIcons } from '@/fsd/5-shared/ui/icons/icon-list';

import { charactersData2 } from '@/fsd/4-entities/character';

const pierceTypeToCharacters = new Map<string, string[]>();
for (const char of charactersData2) {
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
