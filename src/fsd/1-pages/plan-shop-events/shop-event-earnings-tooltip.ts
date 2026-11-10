import type { ShopEventData } from '@/fsd/4-entities/shops';

export interface TooltipSegment {
    text: string;
    bold: boolean;
    italic: boolean;
}

export interface TooltipLine {
    /** Number of leading spaces in the source, used to indent sub-items. */
    indent: number;
    segments: TooltipSegment[];
}

export type EarningsKind = 'f2p' | 'bonusShipment';

export interface WeekTooltip {
    /** Absent when every week has the same explanation. */
    week?: number;
    lines: TooltipLine[];
}

const TAG_RE = /<(\/?)([bi])>/g;

/** Parses the `<b>`/`<i>` and newline markup used by the event JSON's tooltip strings into lines of styled segments. */
export function parseTooltipMarkup(markup: string): TooltipLine[] {
    return markup.split('\n').map(rawLine => {
        const indent = rawLine.length - rawLine.trimStart().length;
        const segments: TooltipSegment[] = [];
        let bold = false;
        let italic = false;
        let lastIndex = 0;
        const push = (text: string) => {
            if (text) segments.push({ text, bold, italic });
        };
        for (const match of rawLine.trimStart().matchAll(TAG_RE)) {
            push(rawLine.trimStart().slice(lastIndex, match.index));
            lastIndex = match.index + match[0].length;
            if (match[2] === 'b') bold = match[1] !== '/';
            else italic = match[1] !== '/';
        }
        push(rawLine.trimStart().slice(lastIndex));
        return { indent, segments };
    });
}

/**
 * The explanation of how the F2P currency or the bonus shipment estimate is reached, one entry per
 * week. When all weeks share the same text it collapses to a single entry with no week number.
 */
export function getEarningsTooltips(event: ShopEventData, kind: EarningsKind): WeekTooltip[] {
    const perWeek = event.weeks
        .map((week, index) => ({
            week: index + 1,
            markup: kind === 'f2p' ? week.earningsTooltip : week.bonusShipmentTooltip,
        }))
        .filter((entry): entry is { week: number; markup: string } => !!entry.markup);

    if (perWeek.length === 0) return [];
    if (perWeek.every(entry => entry.markup === perWeek[0].markup)) {
        return [{ lines: parseTooltipMarkup(perWeek[0].markup) }];
    }
    return perWeek.map(entry => ({ week: entry.week, lines: parseTooltipMarkup(entry.markup) }));
}
