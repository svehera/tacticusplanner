import React, { useContext, useMemo } from 'react';
import { isMobile } from 'react-device-detect';

// eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { DifficultyImage } from '@/shared-components/images/difficulty-image';
// eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { WarZoneBuffImage } from '@/shared-components/images/war-zone-buff-image';
// eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { Difficulty } from 'src/models/enums';
// eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { DispatchContext, StoreContext } from 'src/reducers/store.provider';
// eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { getCompletionRateColor } from 'src/shared-logic/functions';

import { Rank } from '@/fsd/5-shared/model';
import {
    AccessibleTooltip,
    Button,
    Card,
    CardContent,
    CardHeader,
    FlexBox,
    LoaderWithText,
    PortalDialog,
} from '@/fsd/5-shared/ui';
// eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { RarityIcon } from '@/fsd/5-shared/ui/icons/rarity.icon';

// eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { CharactersService } from '@/fsd/3-features/characters/characters.service';
// eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { useGetGuildRosters } from '@/fsd/3-features/guild/guild.endpoint';
// eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { IGuildWarPlayer } from '@/fsd/3-features/guild/guild.models';
// eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { PlayersTable } from '@/fsd/3-features/guild/players-table';
// eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { ViewGuild } from '@/fsd/3-features/guild/view-guild';
// eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { BfLevelSelect } from '@/fsd/3-features/guild-war/bf-level-select';
// eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { IGWLayoutZone } from '@/fsd/3-features/guild-war/guild-war.models';
// eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { GuildWarService } from '@/fsd/3-features/guild-war/guild-war.service';

export const GuildWarZones = () => {
    const { guildWar, guild } = useContext(StoreContext);
    const dispatch = useContext(DispatchContext);

    const { data, loading } = useGetGuildRosters({ members: guild.members });

    const [activeLayout, setActiveLayout] = React.useState(guildWar.layouts[0]);

    const [editZonesMode, setEditZonesMode] = React.useState(false);
    const [editZonePlayersIndex, setEditZonePlayersIndex] = React.useState<number>(-1);
    const [swapZones, setSwapZones] = React.useState<number[]>([]);
    const [tab, setTab] = React.useState(0);
    const [editZonePlayer1, setEditZonePlayer1] = React.useState(false);
    const [editZonePlayer2, setEditZonePlayer2] = React.useState(false);

    const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
        setTab(newValue);
        setActiveLayout(guildWar.layouts[newValue]);
    };

    const handleBfLevelChange = (value: number) => {
        dispatch.guildWar({ type: 'UpdateLayoutBfLevel', bfLevel: value, layoutId: activeLayout.id });
    };

    const handleZoneClick = (zone: IGWLayoutZone, zoneIndex: number) => {
        if (!editZonesMode) {
            setEditZonePlayersIndex(zoneIndex);
            return;
        }

        if (editZonesMode && zone.id === 'frontline') {
            return;
        }

        if (swapZones.length === 0) {
            setSwapZones([zoneIndex]);
            return;
        }

        if (swapZones.length === 1) {
            dispatch.guildWar({
                type: 'SwapLayoutZones',
                layoutId: activeLayout.id,
                zone1Index: swapZones[0],
                zone2Index: zoneIndex,
            });
            setSwapZones([]);
            return;
        }
    };

    const guildWarPlayers: IGuildWarPlayer[] = useMemo(() => {
        if (!data) {
            return [];
        }

        return data.guildUsers.map(user => ({
            username: user,
            unlocked: data.userData[user].characters.filter(x => x.rank > Rank.Locked).length,
            slots: CharactersService.groupByRarityPools(data.userData[user].characters),
            potential: {
                [Difficulty.None]: 0,
                [Difficulty.Easy]: CharactersService.getRosterPotential(
                    data.userData[user].characters,
                    GuildWarService.getDifficultyRarityCapsGrouped(Difficulty.Easy)
                ),
                [Difficulty.Normal]: CharactersService.getRosterPotential(
                    data.userData[user].characters,
                    GuildWarService.getDifficultyRarityCapsGrouped(Difficulty.Normal)
                ),
                [Difficulty.Hard]: CharactersService.getRosterPotential(
                    data.userData[user].characters,
                    GuildWarService.getDifficultyRarityCapsGrouped(Difficulty.Hard)
                ),
                [Difficulty.VeryHard]: CharactersService.getRosterPotential(
                    data.userData[user].characters,
                    GuildWarService.getDifficultyRarityCapsGrouped(Difficulty.VeryHard)
                ),
            },
            enlistedZone: activeLayout.zones.find(x => x.players.includes(user))?.id ?? '',
        }));
    }, [data, activeLayout, guildWar.layouts]);

    const updatePlayerSelection = (player: IGuildWarPlayer) => {
        if (!editZonePlayer1 && !editZonePlayer2) {
            return;
        }

        const players = activeLayout.zones[editZonePlayersIndex].players;
        if (editZonePlayer1) {
            // eslint-disable-next-line react-compiler/react-compiler
            players[0] = player.username;
        }

        if (editZonePlayer2) {
            players[1] = player.username;
        }

        dispatch.guildWar({
            type: 'UpdateZonePlayers',
            layoutId: activeLayout.id,
            zoneIndex: editZonePlayersIndex,
            players,
        });

        setEditZonePlayer1(false);
        setEditZonePlayer2(false);
    };

    const clearPlayerSelection = () => {
        dispatch.guildWar({
            type: 'UpdateZonePlayers',
            layoutId: activeLayout.id,
            zoneIndex: editZonePlayersIndex,
            players: [],
        });

        setEditZonePlayer1(false);
        setEditZonePlayer2(false);
    };

    const editZonePlayersDialogTitle = useMemo(() => {
        if (editZonePlayersIndex < 0) {
            return <></>;
        }

        const zone = activeLayout.zones[editZonePlayersIndex];
        const zoneStats = GuildWarService.getZone(zone.id);
        const { difficulty, caps } = zoneStats.rarityCaps[activeLayout.bfLevel];
        const difficultyEnum: Difficulty = GuildWarService.gwData.difficulties.indexOf(difficulty) + 1;

        return (
            <div>
                {zoneStats.name}
                <FlexBox className="text-lg" gap={5}>
                    <div className="flex items-center gap-[3px]">
                        {caps.map((rarity, index) => (
                            <RarityIcon key={index} rarity={rarity} />
                        ))}
                    </div>
                    <span>{zoneStats.warScore.toString().slice(0, 2)}K</span>
                    <DifficultyImage difficulty={difficultyEnum} />
                    <span>{difficulty}</span>
                </FlexBox>
                {zoneStats.buff && (
                    <FlexBox gap={5}>
                        <WarZoneBuffImage zoneId={zoneStats.iconId ?? zoneStats.id} />
                        <span className="text-base">{zoneStats.buff}</span>
                    </FlexBox>
                )}
            </div>
        );
    }, [editZonePlayersIndex, activeLayout.bfLevel]);

    const assignedPlayers = useMemo(() => {
        return activeLayout.zones.flatMap(x => x.players).filter(user => !!data && data.guildUsers.includes(user));
    }, [activeLayout, guildWar.layouts, data?.guildUsers]);

    const closePlayersDialog = () => {
        setEditZonePlayersIndex(-1);
        setEditZonePlayer1(false);
        setEditZonePlayer2(false);
    };

    return (
        <>
            {loading && <LoaderWithText loading={true} />}
            <FlexBox justifyContent={'center'} gap={10}>
                <BfLevelSelect value={activeLayout.bfLevel} valueChange={handleBfLevelChange} />

                <div
                    className="inline-flex rounded-lg border border-(--border) bg-(--neutral) p-0.5"
                    style={{ zoom: isMobile ? 0.9 : 1 }}>
                    {guildWar.layouts.map((x, index) => (
                        <button
                            key={x.id}
                            onClick={() => handleTabChange({} as React.SyntheticEvent, index)}
                            className={[
                                'cursor-pointer rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                                tab === index
                                    ? 'bg-(--bg) text-(--fg) shadow-sm'
                                    : 'text-(--soft-fg) hover:text-(--fg)',
                            ].join(' ')}>
                            {x.name}
                        </button>
                    ))}
                </div>
            </FlexBox>
            <FlexBox className="mt-2.5" justifyContent={'center'} gap={5}>
                <AccessibleTooltip title={editZonesMode ? 'Select 2 war zones whose positions you want to swap' : ''}>
                    <Button
                        intent={editZonesMode ? 'success' : 'primary'}
                        onPress={() => {
                            setEditZonesMode(value => !value);
                            if (editZonesMode) {
                                setSwapZones([]);
                            }
                        }}>
                        {editZonesMode ? 'Stop editing' : 'Edit war zones'}
                    </Button>
                </AccessibleTooltip>
                {guildWarPlayers.length > 0 && (
                    <>
                        <ViewGuild guildWarPlayers={guildWarPlayers} />
                        <AccessibleTooltip
                            title={
                                <div>
                                    <span>Assigned players:</span>
                                    <ul className="ps-5">
                                        {assignedPlayers.map(username => (
                                            <li key={username}>{username}</li>
                                        ))}
                                    </ul>

                                    <span>Vacant players:</span>
                                    <ul className="ps-5">
                                        {guildWarPlayers
                                            .filter(x => !assignedPlayers.includes(x.username))
                                            .map(player => (
                                                <li key={player.username}>{player.username}</li>
                                            ))}
                                    </ul>
                                </div>
                            }>
                            <b>
                                {assignedPlayers.length}/{guildWarPlayers.length}
                            </b>
                        </AccessibleTooltip>{' '}
                    </>
                )}
            </FlexBox>
            <div className="mt-[10px] grid grid-flow-row grid-cols-[repeat(3,_minmax(180px,_400px))] grid-rows-[repeat(5,_1fr)] justify-center gap-x-[5px] gap-y-[10px] max-[800]:grid-cols-[repeat(3,_minmax(33%,_400px))]">
                {activeLayout.zones.map((zone, index) => (
                    <ZoneCard
                        key={index}
                        bfLevel={activeLayout.bfLevel}
                        zone={zone}
                        players={guildWarPlayers}
                        isSelected={swapZones.includes(index)}
                        onClick={() => handleZoneClick(zone, index)}
                    />
                ))}
            </div>
            <PortalDialog
                open={editZonePlayersIndex >= 0}
                onClose={closePlayersDialog}
                aria-label="Edit zone players"
                size="xl">
                <PortalDialog.Header>{editZonePlayersDialogTitle}</PortalDialog.Header>
                <PortalDialog.Body>
                    <div className="flex gap-2">
                        <AccessibleTooltip title={editZonePlayer1 ? 'Select a player from the table for slot 1' : ''}>
                            <Button
                                isDisabled={editZonePlayer2}
                                onPress={() => setEditZonePlayer1(value => !value)}
                                intent={activeLayout.zones[editZonePlayersIndex]?.players[0] ? 'primary' : 'danger'}
                                appearance="outline">
                                {activeLayout.zones[editZonePlayersIndex]?.players[0] ?? 'Slot 1'}
                            </Button>
                        </AccessibleTooltip>

                        <AccessibleTooltip title={editZonePlayer2 ? 'Select a player from the table for slot 2' : ''}>
                            <Button
                                isDisabled={editZonePlayer1}
                                onPress={() => setEditZonePlayer2(value => !value)}
                                intent={activeLayout.zones[editZonePlayersIndex]?.players[1] ? 'primary' : 'danger'}
                                appearance="outline">
                                {activeLayout.zones[editZonePlayersIndex]?.players[1] ?? 'Slot 2'}
                            </Button>
                        </AccessibleTooltip>
                    </div>
                    <PlayersTable rows={guildWarPlayers} onRowClick={updatePlayerSelection} />
                </PortalDialog.Body>
                <PortalDialog.Footer>
                    <Button intent="danger" appearance="outline" onPress={clearPlayerSelection}>
                        Clear players
                    </Button>
                    <Button appearance="outline" onPress={closePlayersDialog}>
                        Close
                    </Button>
                </PortalDialog.Footer>
            </PortalDialog>
        </>
    );
};

interface ZoneCardProps {
    bfLevel: number;
    zone: IGWLayoutZone;
    players: IGuildWarPlayer[];
    isSelected: boolean;
    onClick: () => void;
}

const ZoneCard: React.FC<ZoneCardProps> = ({ zone, bfLevel, onClick, isSelected, players }) => {
    const zoneStats = GuildWarService.getZone(zone.id);
    const { difficulty, caps } = zoneStats.rarityCaps[bfLevel];
    const maxRarity = Math.max(...caps);
    const maxRarityCount = caps.filter(x => x === maxRarity).length;
    const difficultyEnum: Difficulty = GuildWarService.gwData.difficulties.indexOf(difficulty) + 1;

    const player1 = players.find(x => x.username === zone.players[0]);
    const player2 = players.find(x => x.username === zone.players[1]);

    const player1Potential = player1 ? player1.potential[difficultyEnum] : 0;
    const player2Potential = player2 ? player2.potential[difficultyEnum] : 0;

    const totalPotential = Math.round((player1Potential + player2Potential) / 2);

    const potentialColor = getCompletionRateColor(totalPotential, 100);

    return (
        <Card
            className={[
                'max-w-[400px] cursor-pointer shadow-md',
                isMobile ? 'min-h-[170px]' : 'min-h-[150px]',
                isSelected ? 'bg-(--primary)/10 ring-2 ring-(--primary)' : '',
            ].join(' ')}
            style={{
                borderInlineStart: '10px solid',
                borderInlineColor: potentialColor,
                zoom: isMobile ? 0.7 : 1,
            }}
            onClick={onClick}>
            <CardHeader>
                <div className="flex flex-1 flex-col gap-1">
                    <div className="text-base leading-tight font-semibold">{zoneStats.name}</div>
                    <FlexBox gap={5}>
                        <DifficultyImage difficulty={difficultyEnum} withColor />
                        <span className="inline-flex items-center gap-1">
                            <RarityIcon rarity={maxRarity} />
                            <span className="text-xs font-medium text-(--soft-fg)">×{maxRarityCount}</span>
                        </span>
                        <span>{zoneStats.warScore.toString().slice(0, 2)}K</span>
                        <span>{difficulty}</span>
                    </FlexBox>
                </div>
                {zoneStats.buff && (
                    <AccessibleTooltip title={zoneStats.buff}>
                        <div>
                            <WarZoneBuffImage zoneId={zoneStats.iconId ?? zoneStats.id} />
                        </div>
                    </AccessibleTooltip>
                )}
            </CardHeader>
            <CardContent className="py-2">
                <div className="flex flex-col items-start text-sm">
                    <div>1: {player1 ? `${player1.username} - ${player1Potential}` : ''}</div>
                    <div>2: {player2 ? `${player2.username} - ${player2Potential}` : ''}</div>
                </div>
            </CardContent>
        </Card>
    );
};
