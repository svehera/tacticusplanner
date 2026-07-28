import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { tacticusIcons } from '@/fsd/5-shared/ui/icons';

import { getShopCurrencyIconKey } from './shop-currency-icon';

const DATA_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), 'data');

/** Recursively collects every `cost.type` string found anywhere in a shop JSON file's structure. */
function collectCurrencyTypes(value: unknown, found: Set<string>): void {
    if (Array.isArray(value)) {
        for (const item of value) collectCurrencyTypes(item, found);
        return;
    }
    if (value === null || typeof value !== 'object') return;

    const record = value as Record<string, unknown>;
    const cost = record.cost;
    if (cost !== null && typeof cost === 'object' && typeof (cost as Record<string, unknown>).type === 'string') {
        found.add((cost as Record<string, unknown>).type as string);
    }
    for (const nested of Object.values(record)) collectCurrencyTypes(nested, found);
}

describe('shop-currency-icon', () => {
    it('every currency (cost.type) found across shops/data json files has a registered icon', () => {
        const currencyTypes = new Set<string>();
        for (const file of readdirSync(DATA_DIR)) {
            if (!file.endsWith('.json')) continue;
            const parsed: unknown = JSON.parse(readFileSync(path.join(DATA_DIR, file), 'utf8'));
            collectCurrencyTypes(parsed, currencyTypes);
        }

        expect(currencyTypes.size).toBeGreaterThan(0);

        const missing: string[] = [];
        for (const currencyType of currencyTypes) {
            const iconKey = getShopCurrencyIconKey(currencyType);
            if (iconKey === undefined || !(iconKey in tacticusIcons)) missing.push(currencyType);
        }

        expect(missing, `Currencies missing a registered icon:\n${missing.join('\n')}`).toHaveLength(0);
    });
});
