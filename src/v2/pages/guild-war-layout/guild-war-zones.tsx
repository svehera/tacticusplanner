import {
    Badge,
    Card,
    CardContent,
    CardHeader,
    DialogActions,
    DialogContent,
    DialogTitle,
    Tab,
    Tabs,
    Tooltip,
} from '@mui/material';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import { CommonProps } from '@mui/material/OverridableComponent';
import React, { useContext, useMemo } from 'react';
import { isMobile } from 'react-device-detect';

import { Difficulty } from 'src/models/enums';
import { DispatchContext, StoreContext } from 'src/reducers/store.provider';
import { getCompletionRateColor } from 'src/shared-logic/functions';
import { DifficultyImage } from 'src/v2/components/images/difficulty-image';
import { RarityImage } from 'src/v2/components/images/rarity-image';
import { WarZoneBuffImage } from 'src/v2/components/images/war-zone-buff-image';

import { LoaderWithText, AccessibleTooltip, FlexBox } from '@/fsd/5-shared/ui';

import { Rank } from '@/fsd/4-entities/character';

import { CharactersService } from 'src/v2/features/characters/characters.service';
import { useGetGuildRosters } from 'src/v2/features/guild/guild.endpoint';
import { IGuildWarPlayer } from 'src/v2/features/guild/guild.models';
import { PlayersTable } from 'src/v2/features/guild/players-table';
import { ViewGuild } from 'src/v2/features/guild/view-guild';
import { BfLevelSelect } from 'src/v2/features/guild-war/bf-level-select';
import { IGWLayoutZone } from 'src/v2/features/guild-war/guild-war.models';
import { GuildWarService } from 'src/v2/features/guild-war/guild-war.service';

import './guild-war-zones.scss';

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

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
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

        if (!swapZones.length) {
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
                <FlexBox gap={5} style={{ fontSize: '1.1rem' }}>
                    <div className="flex-box gap3">
                        {caps.map((rarity, index) => (
                            <RarityImage key={index} rarity={rarity} />
                        ))}
                    </div>
                    <span>{zoneStats.warScore.toString().slice(0, 2)}K</span>
                    <DifficultyImage difficulty={difficultyEnum} />
                    <span>{difficulty}</span>
                </FlexBox>
                {zoneStats.buff && (
                    <FlexBox gap={5}>
                        <WarZoneBuffImage zoneId={zoneStats.iconId ?? zoneStats.id} />
                        <span style={{ fontSize: '1rem' }}>{zoneStats.buff}</span>
                    </FlexBox>
                )}
            </div>
        );
    }, [editZonePlayersIndex, activeLayout.bfLevel]);

    const assignedPlayers = useMemo(() => {
        return activeLayout.zones.flatMap(x => x.players).filter(user => !!data && data.guildUsers.includes(user));
    }, [activeLayout, guildWar.layouts, data?.guildUsers]);

    return (
        <>
            {loading && <LoaderWithText loading={true} />}
            <FlexBox justifyContent={'center'} gap={10}>
                <BfLevelSelect value={activeLayout.bfLevel} valueChange={handleBfLevelChange} />

                <Tabs value={tab} onChange={handleTabChange} centered sx={{ zoom: isMobile ? 0.9 : 1 }}>
                    {guildWar.layouts.map(x => {
                        return <Tab key={x.id} label={x.name} />;
                    })}
                </Tabs>
            </FlexBox>
            <FlexBox justifyContent={'center'} gap={5} style={{ marginTop: 10 }}>
                <Tooltip
                    title={'Select 2 war zones whose positions you want to swap'}
                    open={editZonesMode}
                    placement={'top'}>
                    <Button
                        variant={'contained'}
                        onClick={() => {
                            setEditZonesMode(value => !value);
                            if (editZonesMode) {
                                setSwapZones([]);
                            }
                        }}
                        color={editZonesMode ? 'success' : 'primary'}>
                        {editZonesMode ? 'Stop editing' : 'Edit war zones'}
                    </Button>
                </Tooltip>
                {!!guildWarPlayers.length && (
                    <>
                        <ViewGuild guildWarPlayers={guildWarPlayers} />
                        <AccessibleTooltip
                            title={
                                <div>
                                    <span>Assigned players:</span>
                                    <ul style={{ paddingInlineStart: 20 }}>
                                        {assignedPlayers.map(username => (
                                            <li key={username}>{username}</li>
                                        ))}
                                    </ul>

                                    <span>Vacant players:</span>
                                    <ul style={{ paddingInlineStart: 20 }}>
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
            <div className="guild-war-layout-grid">
                {activeLayout.zones.map((zone, index) => (
                    <ZoneCard
                        key={index}
                        bfLevel={activeLayout.bfLevel}
                        zone={zone}
                        players={guildWarPlayers}
                        style={{ backgroundColor: swapZones.includes(index) ? '#409FFF' : '' }}
                        onClick={() => handleZoneClick(zone, index)}
                    />
                ))}
            </div>
            {editZonePlayersIndex >= 0 && (
                <Dialog
                    open={editZonePlayersIndex >= 0}
                    onClose={() => {
                        setEditZonePlayersIndex(-1);
                        setEditZonePlayer1(false);
                        setEditZonePlayer2(false);
                    }}
                    maxWidth={isMobile ? 'xl' : 'lg'}
                    fullWidth>
                    <DialogTitle>{editZonePlayersDialogTitle}</DialogTitle>
                    <DialogContent>
                        <Tooltip
                            title={'Select a player from the table for slot 1'}
                            open={editZonePlayer1}
                            placement={'top'}>
                            <Button
                                disabled={editZonePlayer2}
                                onClick={() => setEditZonePlayer1(value => !value)}
                                color={activeLayout.zones[editZonePlayersIndex].players[0] ? 'primary' : 'error'}>
                                {activeLayout.zones[editZonePlayersIndex].players[0] ?? 'Slot 1'}
                            </Button>
                        </Tooltip>

                        <Tooltip
                            title={'Select a player from the table for slot 2'}
                            open={editZonePlayer2}
                            placement={'top'}>
                            <Button
                                disabled={editZonePlayer1}
                                onClick={() => setEditZonePlayer2(value => !value)}
                                color={activeLayout.zones[editZonePlayersIndex].players[1] ? 'primary' : 'error'}>
                                {activeLayout.zones[editZonePlayersIndex].players[1] ?? 'Slot 2'}
                            </Button>
                        </Tooltip>

                        <PlayersTable rows={guildWarPlayers} onRowClick={updatePlayerSelection} />
                    </DialogContent>
                    <DialogActions>
                        <Button color="error" onClick={clearPlayerSelection}>
                            Clear players
                        </Button>
                        <Button
                            onClick={() => {
                                setEditZonePlayersIndex(-1);
                                setEditZonePlayer1(false);
                                setEditZonePlayer2(false);
                            }}>
                            Close
                        </Button>
                    </DialogActions>
                </Dialog>
            )}
        </>
    );
};

interface ZoneCardProps extends React.DOMAttributes<HTMLElement>, CommonProps {
    bfLevel: number;
    zone: IGWLayoutZone;
    players: IGuildWarPlayer[];
}

const ZoneCard: React.FC<ZoneCardProps> = ({ zone, bfLevel, onClick, style, players }) => {
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
            variant="outlined"
            style={style}
            onClick={onClick}
            sx={{
                maxWidth: 400,
                minHeight: isMobile ? 170 : 150,
                boxShadow: '1px 2px 3px rgba(0, 0, 0, 0.6)',
                cursor: 'pointer',
                borderInlineStart: '10px solid',
                borderInlineColor: potentialColor,
                zoom: isMobile ? 0.7 : 1,
            }}>
            <CardHeader
                titleTypographyProps={{ variant: 'h6', fontSize: isMobile ? '1rem' : undefined }}
                title={zoneStats.name}
                subheader={
                    <FlexBox gap={5}>
                        <DifficultyImage difficulty={difficultyEnum} withColor />
                        <Badge badgeContent={maxRarityCount}>
                            <RarityImage rarity={maxRarity} />
                        </Badge>
                        <span>{zoneStats.warScore.toString().slice(0, 2)}K</span>
                        <span>{difficulty}</span>
                    </FlexBox>
                }
                action={
                    zoneStats.buff ? (
                        <Tooltip title={zoneStats.buff} placement="top" arrow>
                            <div>
                                <WarZoneBuffImage zoneId={zoneStats.iconId ?? zoneStats.id} />
                            </div>
                        </Tooltip>
                    ) : (
                        <></>
                    )
                }
            />
            <CardContent style={{ paddingTop: 0, paddingBottom: 0 }}>
                <FlexBox style={{ flexDirection: 'column', alignItems: 'start' }}>
                    <div>1: {player1 ? `${player1.username} - ${player1Potential}` : ''}</div>
                    <div>2: {player2 ? `${player2.username} - ${player2Potential}` : ''}</div>
                </FlexBox>
            </CardContent>
        </Card>
    );
};
