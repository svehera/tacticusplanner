import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

// eslint-disable-next-line import-x/no-internal-modules
import upgrades from './data/newRecipeData.json';
import { UpgradeImage } from './upgrade-image';

describe('UpgradeImage', () => {
    it('renders an image given the icon path in the snowprint data', () => {
        const [_, upgrade] = Object.entries(upgrades)[0];
        render(<UpgradeImage material={upgrade.material} iconPath={upgrade.icon} />);
        const img = screen.getByAltText(upgrade.material);
        expect(img).toHaveAttribute('src', expect.stringContaining(upgrade.icon));
    });
});
