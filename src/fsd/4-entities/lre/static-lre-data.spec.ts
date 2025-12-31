import { describe, it, expect } from 'vitest';

import { allLegendaryEvents } from './static-lre-data';

// Helper function to check uniform length of arrays
function allArraysSameLength(arrays: any[][]): boolean {
    if (arrays.length === 0) return true;
    const length = arrays[0].length;
    return arrays.every(arr => arr.length === length);
}

describe('Legendary Events Data Integrity', () => {
    allLegendaryEvents.forEach(event => {
        it(`should have uniform track battle counts and correct battle counts for tracks in "${event.name}" LE`, () => {
            expect(event).toHaveProperty('battlesCount');
            expect(event).toHaveProperty('alpha');
            expect(event).toHaveProperty('beta');
            expect(event).toHaveProperty('gamma');

            expect(
                allArraysSameLength([event.alpha.battlesPoints, event.beta.battlesPoints, event.gamma.battlesPoints])
            ).toBe(true);

            expect(event.alpha.battlesPoints.length).toBe(event.battlesCount);
        });
    });
});
