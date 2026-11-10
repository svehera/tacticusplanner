import { describe, expect, it } from 'vitest';

import type { ShopEventData } from '@/fsd/4-entities/shops';

import { getEarningsTooltips, parseTooltipMarkup } from './shop-event-earnings-tooltip';

const eventWith = (weeks: { earningsTooltip?: string; bonusShipmentTooltip?: string }[]): ShopEventData => ({
    id: 'test',
    displayName: 'Test',
    currencyType: 'x',
    startUtc: 0,
    weeks: weeks.map(week => ({ products: [], ...week })),
});

describe('parseTooltipMarkup', () => {
    it('splits lines and applies bold and italic', () => {
        expect(parseTooltipMarkup('<b>Total: 850</b>\n<i>Maximum</i> only')).toEqual([
            { indent: 0, segments: [{ text: 'Total: 850', bold: true, italic: false }] },
            {
                indent: 0,
                segments: [
                    { text: 'Maximum', bold: false, italic: true },
                    { text: ' only', bold: false, italic: false },
                ],
            },
        ]);
    });

    it('keeps the indent of sub-items', () => {
        const [line] = parseTooltipMarkup('  Event milestones: 16 × 8 = <b>128</b>');
        expect(line.indent).toBe(2);
        expect(line.segments.map(s => s.text)).toEqual(['Event milestones: 16 × 8 = ', '128']);
    });
});

describe('getEarningsTooltips', () => {
    it('collapses identical weeks into one entry without a week number', () => {
        const event = eventWith([{ earningsTooltip: 'same' }, { earningsTooltip: 'same' }]);
        const result = getEarningsTooltips(event, 'f2p');
        expect(result).toHaveLength(1);
        expect(result[0].week).toBeUndefined();
    });

    it('lists each week when the explanations differ', () => {
        const event = eventWith([{ bonusShipmentTooltip: 'a' }, { bonusShipmentTooltip: 'b' }]);
        expect(getEarningsTooltips(event, 'bonusShipment').map(x => x.week)).toEqual([1, 2]);
    });

    it('returns nothing when no week has the data', () => {
        expect(getEarningsTooltips(eventWith([{}]), 'f2p')).toEqual([]);
    });
});
