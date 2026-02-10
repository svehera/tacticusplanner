import { describe, it, expect } from 'vitest';

import { tokenLabels } from '../game-mode-tokens.constants';

// This test ensures that every token type in tokenLabels has a defined, truthy icon
describe('TokenAvailability', () => {
    it('should have an icon defined for every token type in tokenLabels', () => {
        Object.keys(tokenLabels as Record<string, any>).forEach(tokenType => {
            expect((tokenLabels as Record<string, any>)[tokenType].icon).toBeTruthy();
        });
    });
});
