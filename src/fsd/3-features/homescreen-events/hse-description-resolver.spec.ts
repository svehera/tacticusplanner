/* eslint-disable boundaries/element-types */
/* eslint-disable import-x/no-internal-modules */
import { describe, expect, it } from 'vitest';

import { homescreenEvents } from '@/fsd/4-entities/homescreen_events';

import { parseAbilityText } from '@/fsd/3-features/character-details/ability-text';

import { collectVariableNames, resolveHseDescriptionLines } from './hse-description-resolver';

function dedupedLocaKeyCount(locaKeyItems: { locaKey?: string }[]): number {
    return new Set(locaKeyItems.map((item, index) => item.locaKey ?? `__no_locakey_${index}`)).size;
}

function dedupedGroupCount(tier: {
    liveEventConfig?: { modifiers?: { locaKey?: string }[]; trackers?: { locaKey?: string }[] };
}) {
    return (
        dedupedLocaKeyCount(tier.liveEventConfig?.modifiers ?? []) +
        dedupedLocaKeyCount(tier.liveEventConfig?.trackers ?? [])
    );
}

describe('hse-description-resolver', () => {
    it('every locaKey-deduped modifier/tracker group aligns 1:1 with a description line', () => {
        const misaligned: string[] = [];
        for (const event of homescreenEvents) {
            for (const [tierKey, tier] of Object.entries(event.tiers)) {
                if (!tier) continue;
                const descriptions = tier.descriptions ?? [];
                if (descriptions.length === 0) continue;

                const groupCount = dedupedGroupCount(tier);

                if (groupCount !== descriptions.length - 2) {
                    misaligned.push(
                        `${event.eventName}/${tierKey}: ${groupCount} groups vs ${descriptions.length} descriptions`
                    );
                }
            }
        }
        expect(
            misaligned,
            `Misaligned HSE tiers (their non-flavor lines get silently dropped):\n${misaligned.join('\n')}`
        ).toHaveLength(0);
    });

    it('every variable referenced in a resolved HSE description line has a value', () => {
        const problems: string[] = [];
        for (const event of homescreenEvents) {
            for (const [tierKey, tier] of Object.entries(event.tiers)) {
                if (!tier) continue;
                const lines = resolveHseDescriptionLines(tier);
                for (const line of lines) {
                    const usedNames = collectVariableNames(parseAbilityText(line.text));
                    for (const name of usedNames) {
                        if (!(name in line.constants) && !(name in line.variables)) {
                            problems.push(`${event.eventName}/${tierKey}: unresolved "${name}" in "${line.text}"`);
                        }
                    }
                }
            }
        }
        expect(problems, `Unresolved HSE description variables:\n${problems.join('\n')}`).toHaveLength(0);
    });

    it('never drops a description line for a currently-aligned tier', () => {
        const dropped: string[] = [];
        for (const event of homescreenEvents) {
            for (const [tierKey, tier] of Object.entries(event.tiers)) {
                if (!tier) continue;
                const descriptions = tier.descriptions ?? [];
                if (descriptions.length === 0) continue;

                if (dedupedGroupCount(tier) !== descriptions.length - 2) continue; // covered by the alignment test above

                const lines = resolveHseDescriptionLines(tier);
                if (lines.length < descriptions.length) {
                    dropped.push(
                        `${event.eventName}/${tierKey}: resolved ${lines.length} of ${descriptions.length} lines`
                    );
                }
            }
        }
        expect(dropped, `Aligned HSE tiers that still dropped a line:\n${dropped.join('\n')}`).toHaveLength(0);
    });
});
