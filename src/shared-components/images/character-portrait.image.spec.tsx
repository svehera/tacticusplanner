import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import newCharacterData from '@/fsd/4-entities/character/data/newCharacterData.json';

import { CharacterPortraitImage } from './character-portrait.image';

describe('CharacterPortraitImage', () => {
    it('renders an image given the icon path in the snowprint data', () => {
        const iconPath = newCharacterData[0]['Icon'];
        render(<CharacterPortraitImage icon={iconPath} />);
        const img = screen.getByRole('img');
        expect(img).toHaveAttribute('alt', iconPath);
        expect(img).toHaveAttribute('width', '60');
        expect(img).toHaveAttribute('height', '80');
    });
});
