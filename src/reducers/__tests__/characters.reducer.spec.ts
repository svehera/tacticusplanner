import { describe, expect, it } from 'vitest';

import { defaultData } from '@/models/constants';
import { GlobalState } from '@/models/global-state';
import { charactersReducer } from '@/reducers/characters.reducer';

describe('charactersReducer SyncWithTacticus', () => {
    it('keeps locked characters at level 1 with ability level 1 when only shards are synced', () => {
        const state = new GlobalState(defaultData).characters;
        const lockedCharacter = state.find(character => character.rank === 0);

        expect(lockedCharacter).toBeDefined();

        const next = charactersReducer(state, {
            type: 'SyncWithTacticus',
            units: [],
            shards: [
                {
                    id: lockedCharacter!.snowprintId,
                    name: lockedCharacter!.name,
                    amount: 17,
                },
            ],
        });

        const syncedCharacter = next.find(character => character.snowprintId === lockedCharacter!.snowprintId);

        expect(syncedCharacter?.rank).toBe(0);
        expect(syncedCharacter?.level).toBe(1);
        expect(syncedCharacter?.activeAbilityLevel).toBe(1);
        expect(syncedCharacter?.passiveAbilityLevel).toBe(1);
        expect(syncedCharacter?.shards).toBe(17);
    });

    it('keeps fully locked characters at level 1 with ability level 1 when absent from sync payload', () => {
        const state = new GlobalState(defaultData).characters;
        const lockedCharacter = state.find(character => character.rank === 0);

        expect(lockedCharacter).toBeDefined();

        const next = charactersReducer(state, {
            type: 'SyncWithTacticus',
            units: [],
            shards: [],
        });

        const syncedCharacter = next.find(character => character.snowprintId === lockedCharacter!.snowprintId);

        expect(syncedCharacter?.rank).toBe(0);
        expect(syncedCharacter?.level).toBe(1);
        expect(syncedCharacter?.activeAbilityLevel).toBe(1);
        expect(syncedCharacter?.passiveAbilityLevel).toBe(1);
        expect(syncedCharacter?.shards).toBe(0);
    });
});
