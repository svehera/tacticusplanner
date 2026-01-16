/* eslint-disable boundaries/element-types */
/* eslint-disable import-x/no-internal-modules */
import { describe, it, expect } from 'vitest';

import { ICharacter2 } from '@/models/interfaces';

import { getLre } from '@/fsd/3-features/lre/get-lre';
import { LegendaryEventBase } from '@/fsd/3-features/lre/model/base.le';
import { LETrack } from '@/fsd/3-features/lre/model/base.le.track';

import { allLegendaryEvents } from './index';

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
    allLegendaryEvents.forEach(staticEvent => {
        it(`Newer Events Must Define Objective Types and Targets`, () => {
            if (staticEvent.id < 10) return; // Only check events starting from Dante.
            const event = getLre(staticEvent.id, [] as ICharacter2[]) as LegendaryEventBase;
            [event.alpha, event.beta, event.gamma].forEach(uncastTrack => {
                const track = uncastTrack as LETrack;
                track.unitsRestrictions.forEach(requirement => {
                    expect(requirement).toHaveProperty('objectiveType');
                    expect(requirement).toHaveProperty('objectiveTarget');
                    expect(typeof requirement.objectiveType).toBe('string');
                    if (requirement.objectiveType !== undefined) {
                        expect(requirement.objectiveType.length).toBeGreaterThan(0);
                    }
                    if ((requirement.objectiveType ?? '') !== 'HasRangedAttack') {
                        expect(typeof requirement.objectiveTarget).toBe('string');
                        expect((requirement.objectiveTarget ?? '').length).toBeGreaterThan(0);
                    }
                });
            });
        });
    });
});
