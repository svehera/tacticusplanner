/* eslint-disable boundaries/element-types */
/* eslint-disable import-x/no-internal-modules */
import { describe, it, expect } from 'vitest';

import { ICharacter2 } from '@/models/interfaces';

import { getLre } from '@/fsd/3-features/lre/get-lre';
import { LegendaryEventBase } from '@/fsd/3-features/lre/model/base.le';
import { LETrack } from '@/fsd/3-features/lre/model/base.le.track';

import { allLegendaryEvents } from './index';

describe('Legendary Events Data Integrity', () => {
    for (const event of allLegendaryEvents) {
        it(`should have uniform track battle counts and correct battle counts for tracks in "${event.name}" LE`, () => {
            expect(event).toHaveProperty('battlesCount');
            expect(event).toHaveProperty('alpha');
            expect(event).toHaveProperty('beta');
            expect(event).toHaveProperty('gamma');

            expect(event.alpha.battlesPoints.length).toBe(event.battlesCount);
            expect(event.beta.battlesPoints.length).toBe(event.battlesCount);
            expect(event.gamma.battlesPoints.length).toBe(event.battlesCount);
        });
    }
    for (const staticEvent of allLegendaryEvents) {
        it(`Newer Events Must Define Objective Types and Targets`, () => {
            if (staticEvent.id < 10) return; // Only check events starting from Dante.
            const event = getLre(staticEvent.id, [] as ICharacter2[]) as LegendaryEventBase;
            for (const uncastTrack of [event.alpha, event.beta, event.gamma]) {
                const track = uncastTrack as LETrack;
                for (const requirement of track.unitsRestrictions) {
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
                }
            }
        });
    }
});
