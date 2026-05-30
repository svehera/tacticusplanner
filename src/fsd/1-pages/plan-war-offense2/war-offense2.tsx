/* eslint-disable boundaries/element-types */
/* eslint-disable import-x/no-internal-modules */
import { RotateCcw, Upload, X } from 'lucide-react';
import { useContext, useRef, useState } from 'react';
import { isMobile } from 'react-device-detect';

import { DispatchContext, StoreContext } from '@/reducers/store.provider';

import { Rank, Rarity } from '@/fsd/5-shared/model';
import { Button } from '@/fsd/5-shared/ui';
import { RaritySelect } from '@/fsd/5-shared/ui/selects';

import { CharactersService, ICharacter2 } from '@/fsd/4-entities/character';
import { IMow2, MowsService } from '@/fsd/4-entities/mow';

import { RosterSnapshotsAssetsProvider } from '../input-roster-snapshots/roster-snapshots-assets-provider';
import { RosterSnapshotsMagnificationSlider } from '../input-roster-snapshots/roster-snapshots-magnification-slider';
import { CharacterGrid } from '../plan-teams2/character-grid';
import { ITeam2 } from '../plan-teams2/models';
import { MowGrid } from '../plan-teams2/mow-grid';
import { TeamFlow } from '../plan-teams2/team-flow';
import { Teams2Service } from '../plan-teams2/teams2.service';

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

    const [zoom, setZoom] = useState<number>(isMobile ? 0.5 : 1);

    const [rarityCap, setRarityCap] = useState<Rarity>(Rarity.Mythic);
    const stagingSectionReference = useRef<HTMLElement>(null);

    const characters = CharactersService.resolveStoredCharacters(unresolvedCharacters);
    const mows = MowsService.resolveAllFromStorage(unresolvedMows);

    const deployableCharacters = characters
        .filter(c => !deployedCharacters.includes(c.snowprintId))
        .filter(c => c.rank !== Rank.Locked)
        .filter(c => !stagedChars.includes(c.snowprintId))
        .toSorted((a, b) => {
            if (b.rank !== a.rank) return b.rank - a.rank;
            const powerA = Math.pow(a.activeAbilityLevel ?? 0, 2) + Math.pow(a.passiveAbilityLevel ?? 0, 2);
            const powerB = Math.pow(b.activeAbilityLevel ?? 0, 2) + Math.pow(b.passiveAbilityLevel ?? 0, 2);
            if (powerB !== powerA) return powerB - powerA;
            return b.rarity - a.rarity;
        });

    const deployableMows = mows
        .filter(m => !deployedMows.includes(m.snowprintId))
        .filter(m => !stagedMows.includes(m.snowprintId))
        .toSorted((a, b) => b.rarity - a.rarity);

    const isTeamDeployable = (team: ITeam2) => {
        return team.chars.every((charId, index) => {
            if (team.flexIndex === undefined) {
                return !deployedCharacters.includes(charId);
            }
            return index < team.flexIndex ? !deployedCharacters.includes(charId) : true;
        });
    };

    const teams = teams2.filter(team => !!team.warOffense).filter(team => isTeamDeployable(team));

    const undeployableTeams = teams2.filter(team => !!team.warOffense).filter(team => !isTeamDeployable(team));

    const stageChar = (char: ICharacter2) => {
        if (!stagedChars.includes(char.snowprintId)) {
            setStagedChars([...stagedChars, char.snowprintId]);
        }
    };

    const unstageChar = (char: ICharacter2) => {
        setStagedChars(stagedChars.filter(id => id !== char.snowprintId));
    };

    const stageMow = (mow: IMow2) => {
        if (!stagedMows.includes(mow.snowprintId)) {
            setStagedMows([...stagedMows, mow.snowprintId]);
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
                setStagedChars(previous => [...previous, charId]);
            }
        }

        for (const mowId of team.mows ?? []) {
            if (!stagedMows.includes(mowId) && !deployedMows.includes(mowId)) {
                setStagedMows(previous => [...previous, mowId]);
            }
        }

        stagingSectionReference.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    const startNewWar = () => {
        if (
            globalThis.confirm('This will reset all units to undeployed and cannot be undone. Do you want to proceed?')
        ) {
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

    const onRarityCapChanged = (newRarity: Rarity) => {
        setRarityCap(newRarity);
    };

    return (
        <RosterSnapshotsAssetsProvider>
            <div className="flex flex-col gap-6 py-6">
                {showApiWarning && (
                    <div className="mb-4 flex items-center justify-between rounded bg-(--warning)/20 p-2 text-sm text-(--warning)">
                        <span>
                            The Tacticus API does not currently return guild-war data, thus deployments must be managed
                            manually.
                        </span>
                        <Button
                            appearance="plain"
                            intent="warning"
                            size="square-petite"
                            onPress={() => {
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
                            }}>
                            <X data-slot="icon" />
                        </Button>
                    </div>
                )}
                {showUnderConstructionWarning && (
                    <div className="mb-4 flex items-center justify-between rounded bg-(--warning)/20 p-2 text-sm text-(--warning)">
                        <span>
                            This page is currently under construction. Expect bugs/errors, and please report them on the
                            community discord.
                        </span>
                        <Button
                            appearance="plain"
                            intent="warning"
                            size="square-petite"
                            onPress={() => {
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
                            }}>
                            <X data-slot="icon" />
                        </Button>
                    </div>
                )}
                <header className="mb-4 flex justify-between">
                    <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-lg font-bold">War Offense</h2>
                        <RosterSnapshotsMagnificationSlider zoom={zoom} setZoom={setZoom} />
                        {/* RARITY CAP */}
                        <div className="flex items-center gap-3">
                            <span className="text-sm font-medium text-(--soft-fg)">Rarity Cap</span>

                            <div className="min-w-[180px]">
                                <RaritySelect
                                    rarityValues={[
                                        Rarity.Common,
                                        Rarity.Uncommon,
                                        Rarity.Rare,
                                        Rarity.Epic,
                                        Rarity.Legendary,
                                        Rarity.Mythic,
                                    ]}
                                    value={rarityCap}
                                    valueChanges={onRarityCapChanged}
                                />
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Button
                            intent="primary"
                            size="small"
                            onPress={startNewWar}
                            isDisabled={deployedCharacters.length === 0 && deployedMows.length === 0}>
                            <RotateCcw data-slot="icon" />
                            Start New War
                        </Button>
                        {!(showApiWarning && showUnderConstructionWarning) && (
                            <Button
                                appearance="outline"
                                size="small"
                                onPress={() => {
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
                <section ref={stagingSectionReference} className="mb-4">
                    <h3 className="text-lg font-semibold">Team Staging</h3>
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
                            zoom={zoom}
                        />
                    </div>
                    <div className="mt-4"> </div>
                    <div className="flex flex-wrap gap-4">
                        <Button
                            intent="success"
                            size="small"
                            onPress={deployTeam}
                            isDisabled={stagedChars.length === 0 || stagedChars.length > 5 || stagedMows.length > 1}>
                            Deploy Team
                        </Button>
                        <Button
                            intent="danger"
                            size="small"
                            onPress={clearTeam}
                            isDisabled={stagedChars.length === 0 && stagedMows.length === 0}>
                            Clear Team
                        </Button>
                    </div>
                </section>

                <details open className="group mb-4 rounded-lg border border-(--card-border) bg-(--card) p-4 shadow-sm">
                    <summary className="cursor-pointer list-none text-lg font-semibold outline-none focus:text-(--primary)">
                        <div className="flex items-center justify-between">
                            <span>Deployable Teams ({teams.length})</span>
                            <span className="transition group-open:rotate-180">▼</span>
                        </div>
                    </summary>
                    <div className="mt-4 flex flex-col">
                        {teams.map((team, index) => (
                            <div
                                key={index}
                                className="relative mb-3 flex items-stretch gap-3 rounded-lg border border-(--card-border) bg-(--card) shadow-sm">
                                {/* 1. Integrated Action Strip */}
                                <button
                                    onClick={() => stageTeam(team)}
                                    className="group flex w-12 flex-shrink-0 flex-col items-center justify-center gap-1 rounded-l-lg bg-(--primary)/10 transition-colors hover:bg-(--primary) hover:text-white"
                                    title="Deploy Team">
                                    <Upload className="size-5 text-(--primary) group-hover:text-white" />
                                    <span className="text-[10px] font-bold tracking-tighter text-(--success) uppercase group-hover:text-white">
                                        Stage
                                    </span>
                                </button>

                                {/* 2. Team Content - Takes up the rest of the space */}
                                <div className="flex-1 overflow-hidden py-3 pr-2">
                                    <div className="mb-2 truncate text-base font-bold text-(--card-fg)">
                                        {team.name}
                                    </div>
                                    <TeamFlow
                                        chars={(
                                            team.chars
                                                .map(charId => characters.find(char => char.snowprintId === charId))
                                                .filter(c => c !== undefined) as ICharacter2[]
                                        ).map(char => Teams2Service.capCharacterAtRarity(char, rarityCap))}
                                        mows={(
                                            team.mows
                                                ?.map(mowId => mows.find(mow => mow.snowprintId === mowId))
                                                .filter(m => m !== undefined) ?? []
                                        ).map(mow => Teams2Service.capMowAtRarity(mow, rarityCap))}
                                        flexIndex={team.flexIndex}
                                        disabledUnits={[...deployedCharacters, ...deployedMows]}
                                        zoom={zoom}
                                        onCharClicked={stageChar}
                                        onMowClicked={stageMow}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </details>

                <details open className="group mb-4 rounded-lg border border-(--card-border) bg-(--card) p-4 shadow-sm">
                    <summary className="cursor-pointer list-none text-lg font-semibold outline-none focus:text-(--primary)">
                        <div className="flex items-center justify-between">
                            <span>Deployable Units ({deployableCharacters.length + deployableMows.length})</span>
                            <span className="transition group-open:rotate-180">▼</span>
                        </div>
                    </summary>
                    <div className="mt-4">
                        <CharacterGrid
                            characters={deployableCharacters.map(char =>
                                Teams2Service.capCharacterAtRarity(char, rarityCap)
                            )}
                            onCharacterSelect={charId =>
                                stageChar(characters.find(char => char.snowprintId === charId)!)
                            }
                            zoom={zoom}
                            showHeader={true}
                        />
                        <MowGrid
                            mows={deployableMows.map(mow => Teams2Service.capMowAtRarity(mow, rarityCap))}
                            onMowSelect={mowId => stageMow(mows.find(mow => mow.snowprintId === mowId)!)}
                            zoom={zoom}
                            showHeader={true}
                        />
                    </div>
                </details>

                <details className="group mb-4 rounded-lg border border-(--card-border) bg-(--card) p-4 shadow-sm">
                    <summary className="cursor-pointer list-none text-lg font-semibold outline-none focus:text-(--primary)">
                        <div className="flex items-center justify-between">
                            <span>Deployed Units ({deployedCharacters.length + deployedMows.length})</span>
                            <span className="transition group-open:rotate-180">▼</span>
                        </div>
                    </summary>
                    <div className="mt-4">
                        <CharacterGrid
                            characters={characters
                                .filter(char => deployedCharacters.includes(char.snowprintId))
                                .map(char => Teams2Service.capCharacterAtRarity(char, rarityCap))}
                            onCharacterSelect={() => {}}
                            showHeader={true}
                            zoom={zoom}
                        />
                        <MowGrid
                            mows={mows
                                .filter(mow => deployedMows.includes(mow.snowprintId))
                                .map(mow => Teams2Service.capMowAtRarity(mow, rarityCap))}
                            onMowSelect={() => {}}
                            showHeader={true}
                            zoom={zoom}
                        />
                    </div>
                </details>

                <details className="group mb-4 rounded-lg border border-(--card-border) bg-(--card) p-4 shadow-sm">
                    <summary className="cursor-pointer list-none text-lg font-semibold outline-none focus:text-(--primary)">
                        <div className="flex items-center justify-between">
                            <span>Undeployable Teams ({undeployableTeams.length})</span>
                            <span className="transition group-open:rotate-180">▼</span>
                        </div>
                    </summary>
                    <div className="mt-4 flex flex-col">
                        {undeployableTeams.map((team, index) => (
                            <div key={index} className="mb-2 flex items-center">
                                <TeamFlow
                                    chars={(
                                        team.chars
                                            .map(charId => characters.find(char => char.snowprintId === charId))
                                            .filter(c => c !== undefined) as ICharacter2[]
                                    ).map(char => Teams2Service.capCharacterAtRarity(char, rarityCap))}
                                    mows={
                                        (
                                            (team.mows ?? [])
                                                ?.map(mowId => mows.find(mow => mow.snowprintId === mowId))
                                                .filter(m => m !== undefined) as IMow2[]
                                        ).map(mow => Teams2Service.capMowAtRarity(mow, rarityCap)) ?? []
                                    }
                                    flexIndex={team.flexIndex}
                                    disabledUnits={[...deployedCharacters, ...deployedMows]}
                                    onCharClicked={stageChar}
                                    onMowClicked={stageMow}
                                    zoom={zoom}
                                />
                            </div>
                        ))}
                    </div>
                </details>
            </div>
        </RosterSnapshotsAssetsProvider>
    );
};
