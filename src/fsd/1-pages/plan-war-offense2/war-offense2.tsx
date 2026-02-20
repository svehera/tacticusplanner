/* eslint-disable boundaries/element-types */
/* eslint-disable import-x/no-internal-modules */
import PublishIcon from '@mui/icons-material/Publish';
import RefreshIcon from '@mui/icons-material/Refresh';
import { Button } from '@mui/material';
import { useContext, useState } from 'react';
import { isMobile } from 'react-device-detect';

import { DispatchContext, StoreContext } from '@/reducers/store.provider';

import { Rank } from '@/fsd/5-shared/model';

import { CharactersService, ICharacter2 } from '@/fsd/4-entities/character';
import { IMow2, MowsService } from '@/fsd/4-entities/mow';

import { RosterSnapshotsAssetsProvider } from '../input-roster-snapshots/roster-snapshots-assets-provider';
import { RosterSnapshotsMagnificationSlider } from '../input-roster-snapshots/roster-snapshots-magnification-slider';
import { CharacterGrid } from '../plan-teams2/character-grid';
import { ITeam2 } from '../plan-teams2/models';
import { MowGrid } from '../plan-teams2/mow-grid';
import { TeamFlow } from '../plan-teams2/team-flow';

export const WarOffense2 = () => {
    const dispatch = useContext(DispatchContext);
    const { characters: unresolvedCharacters, mows: unresolvedMows, warOffense2, teams2 } = useContext(StoreContext);
    const [deployedCharacters, setDeployedCharacters] = useState<string[]>(warOffense2?.deployedCharacters ?? []);
    const [deployedMows, setDeployedMows] = useState<string[]>(warOffense2?.deployedMows ?? []);

    const [stagedChars, setStagedChars] = useState<string[]>([]);
    const [stagedMows, setStagedMows] = useState<string[]>([]);

    const [showApiWarning, setShowApiWarning] = useState(warOffense2?.showApiWarning ?? true);
    const [showUnderConstructionWarning, setShowUnderConstructionWarning] = useState(
        warOffense2?.showUnderConstructionWarning ?? true
    );

    const [sizeMod, setSizeMod] = useState<number>(isMobile ? 0.5 : 1);

    const characters = CharactersService.resolveStoredCharacters(unresolvedCharacters);
    const mows = MowsService.resolveAllFromStorage(unresolvedMows);

    const deployableCharacters = characters
        .filter(c => !deployedCharacters.includes(c.snowprintId!))
        .filter(c => c.rank !== Rank.Locked)
        .filter(c => !stagedChars.includes(c.snowprintId!))
        .sort((a, b) => {
            if (b.rank !== a.rank) return b.rank - a.rank;
            const powerA = Math.pow(a.activeAbilityLevel ?? 0, 2) + Math.pow(a.passiveAbilityLevel ?? 0, 2);
            const powerB = Math.pow(b.activeAbilityLevel ?? 0, 2) + Math.pow(b.passiveAbilityLevel ?? 0, 2);
            if (powerB !== powerA) return powerB - powerA;
            return b.rarity - a.rarity;
        });

    const deployableMows = mows
        .filter(m => !deployedMows.includes(m.snowprintId!))
        .filter(m => !stagedMows.includes(m.snowprintId!))
        .sort((a, b) => b.rarity - a.rarity);

    const isTeamDeployable = (team: ITeam2) => {
        return team.chars.every((charId, index) => {
            if (team.flexIndex === undefined) {
                return !deployedCharacters.includes(charId);
            }
            return index < team.flexIndex ? !deployedCharacters.includes(charId) : true;
        });
    };

    const teams = teams2.filter(team => !!team.warOffense).filter(isTeamDeployable);

    const undeployableTeams = teams2.filter(team => !!team.warOffense).filter(team => !isTeamDeployable(team));

    const stageChar = (char: ICharacter2) => {
        if (!stagedChars.includes(char.snowprintId!)) {
            setStagedChars([...stagedChars, char.snowprintId!]);
        }
    };

    const unstageChar = (char: ICharacter2) => {
        setStagedChars(stagedChars.filter(id => id !== char.snowprintId));
    };

    const stageMow = (mow: IMow2) => {
        if (!stagedMows.includes(mow.snowprintId!)) {
            setStagedMows([...stagedMows, mow.snowprintId!]);
        }
    };

    const unstageMow = (mow: IMow2) => {
        setStagedMows(stagedMows.filter(id => id !== mow.snowprintId));
    };

    const deployTeam = () => {
        setDeployedCharacters([...deployedCharacters, ...stagedChars]);
        setDeployedMows([...deployedMows, ...stagedMows]);
        dispatch.warOffense2({
            type: 'Set',
            value: {
                deployedCharacters: [...deployedCharacters, ...stagedChars],
                deployedMows: [...deployedMows, ...stagedMows],
                showApiWarning,
                showUnderConstructionWarning,
            },
        });
        setStagedChars([]);
        setStagedMows([]);
    };

    const clearTeam = () => {
        setStagedChars([]);
        setStagedMows([]);
    };

    const stageTeam = (team: ITeam2) => {
        for (const charId of team.chars) {
            if (!stagedChars.includes(charId) && !deployedCharacters.includes(charId)) {
                setStagedChars(prev => [...prev, charId]);
            }
        }

        for (const mowId of team.mows ?? []) {
            if (!stagedMows.includes(mowId) && !deployedMows.includes(mowId)) {
                setStagedMows(prev => [...prev, mowId]);
            }
        }
    };

    const startNewWar = () => {
        if (window.confirm('This will reset all units to undeployed and cannot be undone. Do you want to proceed?')) {
            setDeployedCharacters([]);
            setDeployedMows([]);
            setStagedChars([]);
            setStagedMows([]);
            dispatch.warOffense2({
                type: 'Set',
                value: {
                    deployedCharacters: [],
                    deployedMows: [],
                    showApiWarning,
                    showUnderConstructionWarning,
                },
            });
        }
    };

    return (
        <RosterSnapshotsAssetsProvider>
            <div className="flex flex-col gap-6 bg-gray-50 p-2 dark:bg-gray-900">
                {showApiWarning && (
                    <div className="mb-4 flex items-center justify-between rounded bg-red-100 p-2 text-sm text-red-600 dark:bg-red-900 dark:text-red-100">
                        <span>
                            The Tacticus API does not currently return guild-war data, thus deployments must be managed
                            manually.
                        </span>
                        <button
                            onClick={() => {
                                setShowApiWarning(false);
                                dispatch.warOffense2({
                                    type: 'Set',
                                    value: {
                                        deployedCharacters,
                                        deployedMows,
                                        showApiWarning: false,
                                        showUnderConstructionWarning,
                                    },
                                });
                            }}
                            className="min-w-[40px] text-2xl text-red-600 transition hover:text-red-800">
                            &times;
                        </button>
                    </div>
                )}
                {showUnderConstructionWarning && (
                    <div className="mb-4 flex items-center justify-between rounded bg-red-100 p-2 text-sm text-red-600 dark:bg-red-900 dark:text-red-100">
                        <span>
                            This page is currently under construction. Expect bugs/errors, and please report them on the
                            community discord.
                        </span>
                        <button
                            onClick={() => {
                                setShowUnderConstructionWarning(false);
                                dispatch.warOffense2({
                                    type: 'Set',
                                    value: {
                                        deployedCharacters,
                                        deployedMows,
                                        showApiWarning,
                                        showUnderConstructionWarning: false,
                                    },
                                });
                            }}
                            className="min-w-[40px] text-2xl text-red-600 transition hover:text-red-800">
                            &times;
                        </button>
                    </div>
                )}
                <header className="mb-4 flex justify-between">
                    <div className="flex flex-wrap items-center gap-2">
                        <h1 className="text-lg font-bold">War Offense</h1>
                        <RosterSnapshotsMagnificationSlider sizeMod={sizeMod} setSizeMod={setSizeMod} />
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Button
                            className="mr-2 rounded bg-blue-500 px-4 py-2 text-white"
                            variant="contained"
                            onClick={startNewWar}
                            disabled={deployedCharacters.length === 0 && deployedMows.length === 0}>
                            <RefreshIcon className="mr-1" />
                            Start New War
                        </Button>
                        {!(showApiWarning && showUnderConstructionWarning) && (
                            <Button
                                className="mr-2 rounded bg-blue-500 px-4 py-2 text-white"
                                variant="contained"
                                onClick={() => {
                                    setShowApiWarning(true);
                                    setShowUnderConstructionWarning(true);
                                    dispatch.warOffense2({
                                        type: 'Set',
                                        value: {
                                            deployedCharacters,
                                            deployedMows,
                                            showApiWarning: true,
                                            showUnderConstructionWarning: true,
                                        },
                                    });
                                }}>
                                Show Warnings
                            </Button>
                        )}
                    </div>
                </header>
                <section className="mb-4">
                    <h2 className="text-lg font-semibold">To Be Deployed</h2>
                    <div className="flex flex-col gap-2">
                        <TeamFlow
                            chars={
                                stagedChars
                                    .map(charId => characters.find(char => char.snowprintId === charId))
                                    .filter(c => c !== undefined) as ICharacter2[]
                            }
                            mows={
                                stagedMows
                                    .map(mowId => mows.find(mow => mow.snowprintId === mowId))
                                    .filter(m => m !== undefined) as IMow2[]
                            }
                            onCharClicked={unstageChar}
                            onMowClicked={unstageMow}
                            sizeMod={sizeMod}
                        />
                    </div>
                    <div className="mt-4"> </div>
                    <div className="flex flex-wrap gap-4">
                        <Button
                            className="rounded bg-green-500 px-4 py-2 text-xs text-white sm:text-sm md:text-sm lg:text-base"
                            variant="contained"
                            onClick={deployTeam}
                            disabled={stagedChars.length === 0 || stagedChars.length > 5 || stagedMows.length > 1}>
                            Deploy Team
                        </Button>
                        <Button
                            className="rounded bg-green-500 px-4 py-2 text-xs text-white sm:text-[10px] md:text-sm lg:text-base"
                            variant="contained"
                            color="error"
                            onClick={clearTeam}
                            disabled={stagedChars.length === 0 && stagedMows.length === 0}>
                            Clear Team
                        </Button>
                    </div>
                </section>

                <details open className="group mb-4 rounded-lg bg-white p-4 shadow dark:bg-gray-800">
                    <summary className="cursor-pointer list-none text-lg font-semibold outline-none focus:text-blue-600">
                        <div className="flex items-center justify-between">
                            <span>Deployable Teams ({teams.length})</span>
                            <span className="transition group-open:rotate-180">▼</span>
                        </div>
                    </summary>
                    <div className="mt-4 flex flex-col">
                        {teams.map((team, index) => (
                            <div
                                key={index}
                                className="relative mb-3 flex items-stretch gap-3 rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800/50">
                                {/* 1. Integrated Action Strip */}
                                <button
                                    onClick={() => stageTeam(team)}
                                    className="group flex w-12 flex-shrink-0 flex-col items-center justify-center gap-1 rounded-l-lg bg-blue-600/10 transition-colors hover:bg-blue-600 hover:text-white"
                                    title="Deploy Team">
                                    <PublishIcon
                                        className="text-blue-600 group-hover:text-white"
                                        sx={{ fontSize: 20 }}
                                    />
                                    <span className="text-[10px] font-bold tracking-tighter text-blue-600 uppercase group-hover:text-white">
                                        Go
                                    </span>
                                </button>

                                {/* 2. Team Content - Takes up the rest of the space */}
                                <div className="flex-1 overflow-hidden py-3 pr-2">
                                    <TeamFlow
                                        chars={
                                            team.chars
                                                .map(charId => characters.find(char => char.snowprintId === charId))
                                                .filter(c => c !== undefined) as ICharacter2[]
                                        }
                                        mows={
                                            (team.mows
                                                ?.map(mowId => mows.find(mow => mow.snowprintId === mowId))
                                                .filter(m => m !== undefined) as IMow2[]) ?? []
                                        }
                                        flexIndex={team.flexIndex}
                                        disabledUnits={[...deployedCharacters, ...deployedMows]}
                                        sizeMod={sizeMod}
                                        onCharClicked={stageChar}
                                        onMowClicked={stageMow}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </details>

                <details open className="group mb-4 rounded-lg bg-white p-4 shadow dark:bg-gray-800">
                    <summary className="cursor-pointer list-none text-lg font-semibold outline-none focus:text-blue-600">
                        <div className="flex items-center justify-between">
                            <span>Deployable Units ({deployableCharacters.length + deployableMows.length})</span>
                            <span className="transition group-open:rotate-180">▼</span>
                        </div>
                    </summary>
                    <div className="mt-4">
                        <CharacterGrid
                            characters={deployableCharacters}
                            onCharacterSelect={charId =>
                                stageChar(characters.find(char => char.snowprintId === charId)!)
                            }
                            sizeMod={sizeMod}
                            showHeader={true}
                        />
                        <MowGrid
                            mows={deployableMows}
                            onMowSelect={mowId => stageMow(mows.find(mow => mow.snowprintId === mowId)!)}
                            sizeMod={sizeMod}
                            showHeader={true}
                        />
                    </div>
                </details>

                <details className="group mb-4 rounded-lg bg-white p-4 shadow dark:bg-gray-800">
                    <summary className="cursor-pointer list-none text-lg font-semibold outline-none focus:text-blue-600">
                        <div className="flex items-center justify-between">
                            <span>Deployed Units ({deployedCharacters.length + deployedMows.length})</span>
                            <span className="transition group-open:rotate-180">▼</span>
                        </div>
                    </summary>
                    <div className="mt-4">
                        <CharacterGrid
                            characters={characters.filter(char => deployedCharacters.includes(char.snowprintId!))}
                            onCharacterSelect={() => {}}
                            showHeader={true}
                            sizeMod={sizeMod}
                        />
                        <MowGrid
                            mows={mows.filter(mow => deployedMows.includes(mow.snowprintId!))}
                            onMowSelect={() => {}}
                            showHeader={true}
                            sizeMod={sizeMod}
                        />
                    </div>
                </details>

                <details className="group mb-4 rounded-lg bg-white p-4 shadow dark:bg-gray-800">
                    <summary className="cursor-pointer list-none text-lg font-semibold outline-none focus:text-blue-600">
                        <div className="flex items-center justify-between">
                            <span>Undeployable Teams ({undeployableTeams.length})</span>
                            <span className="transition group-open:rotate-180">▼</span>
                        </div>
                    </summary>
                    <div className="mt-4 flex flex-col">
                        {undeployableTeams.map((team, index) => (
                            <div key={index} className="mb-2 flex items-center">
                                <TeamFlow
                                    chars={
                                        team.chars
                                            .map(charId => characters.find(char => char.snowprintId === charId))
                                            .filter(c => c !== undefined) as ICharacter2[]
                                    }
                                    mows={
                                        (team.mows
                                            ?.map(mowId => mows.find(mow => mow.snowprintId === mowId))
                                            .filter(m => m !== undefined) as IMow2[]) ?? []
                                    }
                                    flexIndex={team.flexIndex}
                                    disabledUnits={[...deployedCharacters, ...deployedMows]}
                                    onCharClicked={stageChar}
                                    onMowClicked={stageMow}
                                    sizeMod={sizeMod}
                                />
                            </div>
                        ))}
                    </div>
                </details>
            </div>
        </RosterSnapshotsAssetsProvider>
    );
};
