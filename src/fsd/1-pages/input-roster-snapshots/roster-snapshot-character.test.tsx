import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import { CharactersService } from '@/fsd/4-entities/character';

// eslint-disable-next-line import-x/no-internal-modules
import { RosterSnapshotShowVariableSettings } from '@/fsd/3-features/view-settings/model';

import { RosterSnapshotCharacter } from './roster-snapshot-character';

describe('RosterSnapshotCharacter', () => {
    it('renders an image given the icon path in the snowprint data', () => {
        const character = CharactersService.charactersData[0];
        render(
            <RosterSnapshotCharacter
                charData={character}
                showShards={RosterSnapshotShowVariableSettings.Always}
                showMythicShards={RosterSnapshotShowVariableSettings.Always}
                showXpLevel={RosterSnapshotShowVariableSettings.Always}
            />
        );
        const img = screen.getByAltText('character');
        expect(img).toHaveAttribute('src', expect.stringContaining(character.icon));
    });
});
