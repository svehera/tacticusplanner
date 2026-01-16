import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

// eslint-disable-next-line boundaries/element-types
import { CharactersService } from '@/fsd/4-entities/character';

import { UnitShardIcon } from './unit-shard.icon';

describe('UnitShardIcon', () => {
    it('renders an image given the icon path in the snowprint data', () => {
        const character = CharactersService.charactersData[0];
        render(<UnitShardIcon icon={character.roundIcon} name={character.name} />);
        const img = screen.getByAltText(character.name);
        expect(img).toHaveRole('img');
        expect(img).toHaveAttribute('src', expect.stringContaining(character.roundIcon));
    });
});
