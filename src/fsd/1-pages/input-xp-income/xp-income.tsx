import React, { useCallback, useContext, useMemo, useState } from 'react';

// eslint-disable-next-line import-x/no-internal-modules
import { DispatchContext, StoreContext } from '@/reducers/store.provider';

import { Rarity, RarityStars } from '@/fsd/5-shared/model';

import { CharactersService } from '@/fsd/4-entities/character';

import { CalculatorCard } from './calculator-card';
import { computeSources } from './compute-sources';
import { HeroRail } from './hero-rail';
import { XpIncomeState } from './models';
import { useDebouncedState } from './use-debounced-state';
import { blueStarCharacters } from './xp-income.service';

type SourceId = 'arena' | 'raid' | 'at' | 'other';

export const XpIncome: React.FC = () => {
    const { characters, xpIncome } = useContext(StoreContext);
    const dispatch = useContext(DispatchContext);

    // ── Debounced slider/input values ──────────────────────────────
    const [raidLoops, setRaidLoops] = useDebouncedState('raidLoops', xpIncome.raidLoops, xpIncome);
    const [extraBossesAfterLoop, setExtraBossesAfterLoop] = useDebouncedState(
        'extraBossesAfterLoop',
        xpIncome.extraBossesAfterLoop,
        xpIncome
    );
    const [additionalBosses, setAdditionalBosses] = useDebouncedState(
        'additionalBosses',
        xpIncome.additionalBosses,
        xpIncome
    );
    const [eliteEnergyPerDay, setEliteEnergyPerDay] = useDebouncedState(
        'eliteEnergyPerDay',
        xpIncome.eliteEnergyPerDay,
        xpIncome
    );
    const [nonEliteEnergyPerDay, setNonEliteEnergyPerDay] = useDebouncedState(
        'nonEliteEnergyPerDay',
        xpIncome.nonEliteEnergyPerDay,
        xpIncome
    );

    // ── Store helpers ──────────────────────────────────────────────
    const dispatchUpdate = useCallback(
        (key: keyof XpIncomeState, value: XpIncomeState[keyof XpIncomeState]) => {
            dispatch.xpIncome({
                type: 'SaveXpIncomeState',
                value: { ...xpIncome, [key]: value },
            });
        },
        [dispatch, xpIncome]
    );

    // ── Roster-derived blue-star char IDs ─────────────────────────
    const resolvedCharacters = useMemo(() => CharactersService.resolveStoredCharacters(characters), [characters]);

    const blueStarCharIds = useMemo(
        () =>
            blueStarCharacters
                .filter(
                    char =>
                        (resolvedCharacters.find(c => c.snowprintId === char.id)?.stars ?? RarityStars.None) >=
                        RarityStars.OneBlueStar
                )
                .map(char => char.id),
        [resolvedCharacters]
    );

    // ── Per-source breakdown ───────────────────────────────────────
    const sources = useMemo(
        () =>
            computeSources(
                xpIncome,
                blueStarCharIds,
                raidLoops,
                extraBossesAfterLoop,
                additionalBosses,
                eliteEnergyPerDay,
                nonEliteEnergyPerDay
            ),
        [
            xpIncome,
            blueStarCharIds,
            raidLoops,
            extraBossesAfterLoop,
            additionalBosses,
            eliteEnergyPerDay,
            nonEliteEnergyPerDay,
        ]
    );

    const helperWeekly = useMemo(() => sources.reduce((sum, s) => sum + s.weekly, 0), [sources]);
    const helperDaily = helperWeekly / 7;

    // ── Accordion state (single-expand) ───────────────────────────
    const [expanded, setExpanded] = useState<Record<SourceId, boolean>>({
        arena: false,
        raid: false,
        at: false,
        other: false,
    });

    const toggleExpanded = useCallback((id: SourceId) => {
        setExpanded(previous => ({
            arena: false,
            raid: false,
            at: false,
            other: false,
            [id]: !previous[id],
        }));
    }, []);

    // ── Apply calculator total to manual field ─────────────────────
    const handleApply = useCallback(() => {
        dispatchUpdate('manualCodicesPerDay', Math.round(helperDaily * 100) / 100);
    }, [dispatchUpdate, helperDaily]);

    const chosenName = Rarity[xpIncome.defaultCodexToUse ?? Rarity.Legendary];

    return (
        <>
            <h2>XP Income</h2>
            <p className="-mt-1 mb-5 max-w-2xl text-sm text-[var(--muted-fg)]">
                Pick your codex rarity, then tell us how many you earn per day. Use the calculator on the left if
                you&apos;d like help.
            </p>

            {/* Responsive 2-column grid:
                  ≥ 1100px → calculator left (flex), hero rail right (380px sticky)
                  < 1100px → single column, hero first */}
            <div className="grid items-start gap-5 [@media(min-width:1100px)]:grid-cols-[minmax(0,1fr)_380px]">
                <div className="order-2 min-w-0 [@media(min-width:1100px)]:order-1">
                    <CalculatorCard
                        state={xpIncome}
                        sources={sources}
                        helperWeekly={helperWeekly}
                        helperDaily={helperDaily}
                        chosenName={chosenName}
                        expanded={expanded}
                        onToggle={toggleExpanded}
                        blueStarCharIds={blueStarCharIds}
                        resolvedCharacters={resolvedCharacters}
                        raidLoops={raidLoops}
                        setRaidLoops={setRaidLoops}
                        extraBossesAfterLoop={extraBossesAfterLoop}
                        setExtraBossesAfterLoop={setExtraBossesAfterLoop}
                        additionalBosses={additionalBosses}
                        setAdditionalBosses={setAdditionalBosses}
                        eliteEnergyPerDay={eliteEnergyPerDay}
                        setEliteEnergyPerDay={setEliteEnergyPerDay}
                        nonEliteEnergyPerDay={nonEliteEnergyPerDay}
                        setNonEliteEnergyPerDay={setNonEliteEnergyPerDay}
                        onUpdate={dispatchUpdate}
                        onApply={handleApply}
                    />
                </div>
                <div className="order-1 [@media(min-width:1100px)]:order-2">
                    <HeroRail
                        state={xpIncome}
                        chosenName={chosenName}
                        helperDaily={helperDaily}
                        onUpdate={dispatchUpdate}
                        onApply={handleApply}
                    />
                </div>
            </div>

            {/* Bottom breathing room */}
            <div className="h-10" />
        </>
    );
};
