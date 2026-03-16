import { describe, expect, it } from 'vitest';

import { defaultData } from '@/models/constants';
import { GlobalState } from '@/models/global-state';

import { Rank } from '@/fsd/5-shared/model';

describe('GlobalState.initCharacters', () => {
    it('initializes locked characters with level 1 and ability levels 1', () => {
        const state = new GlobalState(defaultData);
        const lockedCharacter = state.characters.find(character => character.rank === Rank.Locked);

        expect(lockedCharacter).toBeDefined();
        expect(lockedCharacter?.level).toBe(1);
        expect(lockedCharacter?.activeAbilityLevel).toBe(1);
        expect(lockedCharacter?.passiveAbilityLevel).toBe(1);
    });
});
