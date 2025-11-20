import React, { useMemo, useContext, useCallback } from 'react';

// eslint-disable-next-line import-x/no-internal-modules
import { DispatchContext, StoreContext } from '@/reducers/store.provider';

import { Rarity, RarityStars } from '@/fsd/5-shared/model';
import { UnitShardIcon } from '@/fsd/5-shared/ui/icons';

import { CharactersService } from '@/fsd/4-entities/character';

import { XpIncomeState } from '@/fsd/1-pages/input-xp-income';

import { DecimalSpinner } from './decimal-spinner';
import { ArenaLeague } from './models';
import { useDebouncedState } from './use-debounced-state';
import { kBlueStarCharacters, kEliteEnergyPerRaid, kNonEliteEnergyPerRaid, XpIncomeService } from './xp-income.service';

const kArenaName: Record<ArenaLeague, string> = {
    [ArenaLeague.kHonorGuard]: 'Honor Guard',
    [ArenaLeague.kCaptain]: 'Captains',
    [ArenaLeague.kChapterMaster]: 'Chapter Master',
};

const kEliteEnergyMax = 600;
const kNonEliteEnergyMax = 600;

export const XpIncome: React.FC = () => {
    const { characters, xpIncomeState } = useContext(StoreContext);
    const dispatch = useContext(DispatchContext);

    const {
        manualBooksPerDay,
        arenaLeague,
        loopsRaids,
        clearRarity,
        useAtForBooks,
        blueStarCharIds,
        hasBlueStarMoW,
        additionalBooksPerWeek,
        onslaughtBlueStar,
        incursionLegendaryLevel,
    } = xpIncomeState;

    const [raidLoops, setRaidLoops] = useDebouncedState('raidLoops', xpIncomeState.raidLoops, xpIncomeState);
    const [extraBossesAfterLoop, setExtraBossesAfterLoop] = useDebouncedState(
        'extraBossesAfterLoop',
        xpIncomeState.extraBossesAfterLoop,
        xpIncomeState
    );
    const [additionalBosses, setAdditionalBosses] = useDebouncedState(
        'additionalBosses',
        xpIncomeState.additionalBosses,
        xpIncomeState
    );
    const [eliteEnergyPerDay, setEliteEnergyPerDay] = useDebouncedState(
        'eliteEnergyPerDay',
        xpIncomeState.eliteEnergyPerDay,
        xpIncomeState
    );
    const [nonEliteEnergyPerDay, setNonEliteEnergyPerDay] = useDebouncedState(
        'nonEliteEnergyPerDay',
        xpIncomeState.nonEliteEnergyPerDay,
        xpIncomeState
    );

    const resolvedCharacters = useMemo(() => CharactersService.resolveStoredCharacters(characters), [characters]);

    const dispatchUpdate = useCallback(
        (key: keyof XpIncomeState, value: XpIncomeState[keyof XpIncomeState]) => {
            dispatch.xpIncomeState({
                type: 'SaveXpIncomeState',
                value: {
                    ...xpIncomeState,
                    [key]: value,
                },
            });
        },
        [dispatch, xpIncomeState]
    );

    const estimatedBooksPerWeek = useMemo(
        () =>
            XpIncomeService.estimateWeeklyBookIncome(
                arenaLeague,
                loopsRaids,
                raidLoops,
                extraBossesAfterLoop,
                clearRarity,
                additionalBosses,
                useAtForBooks,
                blueStarCharIds,
                hasBlueStarMoW,
                incursionLegendaryLevel,
                onslaughtBlueStar,
                eliteEnergyPerDay,
                nonEliteEnergyPerDay,
                additionalBooksPerWeek
            ),
        [
            arenaLeague,
            loopsRaids,
            clearRarity,
            useAtForBooks,
            hasBlueStarMoW,
            additionalBooksPerWeek,
            onslaughtBlueStar,
            incursionLegendaryLevel,
            blueStarCharIds,
            raidLoops,
            extraBossesAfterLoop,
            additionalBosses,
            eliteEnergyPerDay,
            nonEliteEnergyPerDay,
        ]
    );

    const estimatedBooksPerDay = estimatedBooksPerWeek / 7;

    return (
        <div
            className="p-5 rounded-lg max-w-2xl mx-auto font-sans 
                        bg-white text-gray-800 shadow-lg 
                        dark:bg-gray-900 dark:text-white">
            <div
                className="mb-5 p-4 rounded-lg border border-gray-200 
                            bg-gray-50 dark:bg-gray-800 dark:border-gray-700">
                <DecimalSpinner
                    label="Legendary Books / Day"
                    value={manualBooksPerDay}
                    onChange={value => dispatchUpdate('manualBooksPerDay', value)}
                />
            </div>

            <hr className="my-5 border-gray-300 dark:border-gray-700" />

            <h3 className="mb-4 text-lg font-semibold">Let Me Help You Estimate</h3>

            <div
                className="p-4 rounded-lg border border-gray-200 
                            bg-gray-50 dark:bg-gray-800 dark:border-gray-700">
                <h4 className="mb-2 font-semibold">Arena League</h4>
                <select
                    value={arenaLeague}
                    onChange={e => dispatchUpdate('arenaLeague', e.target.value as unknown as ArenaLeague)}
                    className="p-2 rounded-md border border-gray-300 bg-white 
                               dark:bg-gray-700 dark:border-gray-600 dark:text-white 
                               focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {Object.values(ArenaLeague)
                        .filter(league => typeof league === 'number')
                        .map(league => (
                            <option key={league} value={league}>
                                {kArenaName[league]}
                            </option>
                        ))}
                </select>

                <h4 className="mt-5 font-semibold">Guild Raid</h4>
                <p>Do you loop guild raids?</p>
                <div className="flex gap-5 mt-2 mb-4">
                    <label>
                        <input
                            type="radio"
                            value="yes"
                            checked={loopsRaids === 'yes'}
                            onChange={() => dispatchUpdate('loopsRaids', 'yes')}
                            className="mr-2"
                        />{' '}
                        Yes
                    </label>
                    <label>
                        <input
                            type="radio"
                            value="no"
                            checked={loopsRaids === 'no'}
                            onChange={() => dispatchUpdate('loopsRaids', 'no')}
                            className="mr-2"
                        />{' '}
                        No
                    </label>
                </div>

                <div
                    className={`p-3 mt-3 rounded-md border-l-4 
                                ${loopsRaids === 'yes' ? 'border-orange-500' : 'border-green-500'} 
                                bg-gray-100 dark:bg-gray-700`}>
                    {loopsRaids === 'yes' ? (
                        <>
                            <p>
                                Loops Done: <span className="text-lg font-bold">{raidLoops}</span>
                            </p>
                            <input
                                type="range"
                                min="1"
                                max="15"
                                value={raidLoops}
                                onChange={e => setRaidLoops(parseInt(e.target.value))}
                                className="w-full mt-1 accent-orange-500"
                            />
                            <p className="mt-3">
                                Extra Bosses (after final full loop):{' '}
                                <span className="text-lg font-bold">{extraBossesAfterLoop}</span>
                            </p>
                            <input
                                type="range"
                                min="0"
                                max="5"
                                value={extraBossesAfterLoop}
                                onChange={e => setExtraBossesAfterLoop(parseInt(e.target.value))}
                                className="w-full mt-1 accent-orange-500"
                            />
                        </>
                    ) : (
                        <>
                            <p className="mb-2">Highest Rarity Fully Cleared:</p>
                            <select
                                value={clearRarity}
                                onChange={e => dispatchUpdate('clearRarity', parseInt(e.target.value, 10) as Rarity)}
                                className="p-2 rounded-md border border-gray-300 bg-white dark:bg-gray-600 dark:border-gray-500 dark:text-white">
                                {[Rarity.Common, Rarity.Uncommon, Rarity.Rare, Rarity.Epic].map(rarity => (
                                    <option key={rarity} value={rarity}>
                                        {Rarity[rarity]}
                                    </option>
                                ))}
                            </select>
                            <p className="mt-3">
                                Additional Bosses Cleared: <span className="text-lg font-bold">{additionalBosses}</span>
                            </p>
                            <input
                                type="range"
                                min="0"
                                max="5"
                                value={additionalBosses}
                                onChange={e => setAdditionalBosses(parseInt(e.target.value))}
                                className="w-full mt-1 accent-green-500"
                            />
                        </>
                    )}
                </div>

                <h4 className="mt-5 font-semibold">AT Purchases (via Blue Star Characters)</h4>
                <p>Do you use AT to buy books?</p>
                <div className="flex gap-5 mt-2 mb-4">
                    <label>
                        <input
                            type="radio"
                            value="yes"
                            checked={useAtForBooks === 'yes'}
                            onChange={() => dispatchUpdate('useAtForBooks', 'yes')}
                            className="mr-2"
                        />{' '}
                        Yes
                    </label>
                    <label>
                        <input
                            type="radio"
                            value="no"
                            checked={useAtForBooks === 'no'}
                            onChange={() => dispatchUpdate('useAtForBooks', 'no')}
                            className="mr-2"
                        />{' '}
                        No
                    </label>
                </div>

                {useAtForBooks === 'yes' && (
                    <div className="p-3 mt-3 rounded-md border-l-4 border-yellow-500 bg-gray-100 dark:bg-gray-700">
                        <p className="mb-2 font-medium">Static AT Sources (Select characters for farming):</p>
                        <div className="flex flex-wrap gap-4">
                            {kBlueStarCharacters.map(char => {
                                const isStarred =
                                    (resolvedCharacters.find(c => c.snowprintId! === char.id)?.stars ??
                                        RarityStars.None) >= RarityStars.OneBlueStar;

                                return (
                                    <div
                                        key={char.id}
                                        className="relative"
                                        title={`${char.id} (${char.shardsPerWeek} S/W)`}>
                                        {
                                            <UnitShardIcon
                                                icon={
                                                    CharactersService.charactersData.find(
                                                        c => c.snowprintId! === char.id
                                                    )?.roundIcon ?? ''
                                                }
                                            />
                                        }

                                        <div
                                            className={`absolute top-0 right-0 w-5 h-5 rounded-full border-2 
                                                    flex items-center justify-center text-xs font-bold transition-all
                                                    
                                                    // Appearance when starred (visible)
                                                    ${
                                                        isStarred
                                                            ? 'opacity-100 scale-100 bg-green-500 border-white text-white dark:border-gray-900'
                                                            : 'opacity-0 scale-0' // Hidden when not starred
                                                    }
                                                    `}>
                                            ✓
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <h5 className="mt-6 pt-3 text-sm font-medium border-t border-gray-300 dark:border-gray-600">
                            Incursion Farming (MoW)
                        </h5>
                        <p>MoW at blue star for Incursion farming?</p>
                        <div className="flex gap-5 mt-2 mb-4">
                            <label>
                                <input
                                    type="radio"
                                    value="yes"
                                    checked={hasBlueStarMoW === 'yes'}
                                    onChange={() => dispatchUpdate('hasBlueStarMoW', 'yes')}
                                    className="mr-2"
                                />{' '}
                                Yes
                            </label>
                            <label>
                                <input
                                    type="radio"
                                    value="no"
                                    checked={hasBlueStarMoW === 'no'}
                                    onChange={() => dispatchUpdate('hasBlueStarMoW', 'no')}
                                    className="mr-2"
                                />{' '}
                                No
                            </label>
                        </div>

                        {hasBlueStarMoW === 'yes' && (
                            <div className="pl-4 mt-2 border-l border-gray-400 dark:border-gray-600">
                                <p className="mb-2 text-sm font-semibold">Which Legendary Level are you farming?</p>
                                <div className="flex gap-4">
                                    <label className="flex items-center">
                                        <input
                                            type="radio"
                                            value="L10"
                                            checked={incursionLegendaryLevel === 'L10'}
                                            onChange={() => dispatchUpdate('incursionLegendaryLevel', 'L10')}
                                            className="mr-2"
                                        />
                                        Legendary 10
                                    </label>
                                    <label className="flex items-center">
                                        <input
                                            type="radio"
                                            value="L12"
                                            checked={incursionLegendaryLevel === 'L12'}
                                            onChange={() => dispatchUpdate('incursionLegendaryLevel', 'L12')}
                                            className="mr-2"
                                        />
                                        Legendary 12
                                    </label>
                                    <label className="flex items-center">
                                        <input
                                            type="radio"
                                            value="L12"
                                            checked={incursionLegendaryLevel === 'M'}
                                            onChange={() => dispatchUpdate('incursionLegendaryLevel', 'M')}
                                            className="mr-2"
                                        />
                                        Legendary 12
                                    </label>
                                </div>
                            </div>
                        )}

                        <h5 className="mt-4 pt-3 text-sm font-medium border-t border-gray-300 dark:border-gray-600">
                            Onslaught Farming Income
                        </h5>
                        <p>Are you onslaughting a Blue Star character?</p>
                        <div className="flex gap-5 mt-2 mb-4">
                            <label>
                                <input
                                    type="radio"
                                    value="yes"
                                    checked={onslaughtBlueStar === 'yes'}
                                    onChange={() => dispatchUpdate('onslaughtBlueStar', 'yes')}
                                    className="mr-2"
                                />{' '}
                                Yes
                            </label>
                            <label>
                                <input
                                    type="radio"
                                    value="no"
                                    checked={onslaughtBlueStar === 'no'}
                                    onChange={() => dispatchUpdate('onslaughtBlueStar', 'no')}
                                    className="mr-2"
                                />{' '}
                                No
                            </label>
                        </div>

                        <h5 className="mt-4 pt-3 text-sm font-medium border-t border-gray-300 dark:border-gray-600">
                            Elite Node Energy Usage
                        </h5>
                        <div className="py-2">
                            <label className="block mb-2 text-sm">
                                Energy spent on Elite Nodes/Day ({kEliteEnergyPerRaid} energy increments):
                            </label>
                            <div className="flex items-center gap-4">
                                <input
                                    type="range"
                                    min="0"
                                    max={kEliteEnergyMax}
                                    step={kEliteEnergyPerRaid}
                                    value={eliteEnergyPerDay}
                                    onChange={e => setEliteEnergyPerDay(parseInt(e.target.value))}
                                    className="w-full mt-1 accent-yellow-500"
                                />
                                <span className="w-12 text-right font-bold">{eliteEnergyPerDay}</span>
                            </div>
                        </div>

                        <h5 className="mt-4 pt-3 text-sm font-medium border-t border-gray-300 dark:border-gray-600">
                            Non-Elite Node Energy Usage
                        </h5>
                        <div className="py-2">
                            <label className="block mb-2 text-sm">
                                Energy spent on Non-Elite Nodes/Day ({kNonEliteEnergyPerRaid} energy increments):
                            </label>
                            <div className="flex items-center gap-4">
                                <input
                                    type="range"
                                    min="0"
                                    max={kNonEliteEnergyMax}
                                    step={kNonEliteEnergyPerRaid}
                                    value={nonEliteEnergyPerDay}
                                    onChange={e => setNonEliteEnergyPerDay(parseInt(e.target.value))}
                                    className="w-full mt-1 accent-yellow-500"
                                />
                                <span className="w-12 text-right font-bold">{nonEliteEnergyPerDay}</span>
                            </div>
                        </div>
                    </div>
                )}

                <DecimalSpinner
                    label="Add'l Books/Week from unspecified sources"
                    value={additionalBooksPerWeek}
                    onChange={value => dispatchUpdate('additionalBooksPerWeek', value)}
                />
            </div>

            <div
                className="mt-5 p-4 rounded-lg border-2 border-green-600 
                            bg-green-50 dark:bg-green-900 dark:border-green-400 text-center">
                <h3 className="text-gray-900 dark:text-white">Daily Book Estimate</h3>
                <p className="mt-2 text-gray-700 dark:text-gray-300">
                    Estimated Breakdown:{' '}
                    <span className="text-xl font-bold block">{estimatedBooksPerDay.toFixed(2)}</span>
                </p>
                <p className="mt-3 text-lg font-bold">
                    TOTAL Books/Day:{' '}
                    <span className="text-3xl font-extrabold text-green-600 dark:text-green-400 block">
                        {(manualBooksPerDay + estimatedBooksPerDay).toFixed(2)}
                    </span>
                </p>
            </div>
        </div>
    );
};
