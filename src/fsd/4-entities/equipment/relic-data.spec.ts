/* eslint-disable import-x/no-internal-modules */

import { describe, expect, it } from 'vitest';

import newEquipmentData from './data/new-equipment-data.json';

describe('relic-data', () => {
    it('all relics specify only allowedUnits, never allowedFactions', () => {
        const relics = Object.entries(newEquipmentData).filter(([id]) => id.startsWith('R_'));
        expect(relics.length).toBeGreaterThan(0);
        for (const [id, relic] of relics) {
            expect(relic.allowedFactions, `${id} has non-empty allowedFactions`).toHaveLength(0);
        }
    });
});
