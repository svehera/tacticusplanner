import React, { DOMAttributes, useContext } from 'react';
import { DispatchContext, StoreContext } from 'src/reducers/store.provider';
import { FlexBox } from 'src/v2/components/flex-box';

import { IGWLayoutZone, ZoneId } from 'src/v2/features/guild-war/guild-war.models';
import { Card, CardContent, CardHeader, Tab, Tabs, Tooltip } from '@mui/material';
import Button from '@mui/material/Button';
import { GuildWarService } from 'src/v2/features/guild-war/guild-war.service';
import { BfLevelSelect } from 'src/v2/features/guild-war/bf-level-select';
import { DifficultyImage } from 'src/v2/components/images/difficulty-image';
import { isMobile } from 'react-device-detect';
import IconButton from '@mui/material/IconButton';
import { Edit } from '@mui/icons-material';
import './guild-war-zones.scss';
import { CommonProps } from '@mui/material/OverridableComponent';
import { useGetGuildInsights, useGetGuildRosters } from 'src/v2/features/guild/guild.endpoint';
import { Loader } from 'src/v2/components/loader';
import { ViewPlayers } from 'src/v2/features/guild/view-players';

export const GuildWarZones = () => {
    const { guildWar, guild } = useContext(StoreContext);
    const dispatch = useContext(DispatchContext);

    const { data, loading } = useGetGuildRosters({ members: guild.members });

    const [activeLayout, setActiveLayout] = React.useState(guildWar.layouts[0]);

    const [editMode, setEditMode] = React.useState(false);
    const [swapZones, setSwapZones] = React.useState<number[]>([]);
    const [tab, setTab] = React.useState(0);

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setTab(newValue);
        setActiveLayout(guildWar.layouts[newValue]);
    };

    const handleBfLevelChange = (value: number) => {
        dispatch.guildWar({ type: 'UpdateLayoutBfLevel', bfLevel: value, layoutId: activeLayout.id });
    };

    const handleZoneClick = (zoneId: ZoneId, zoneIndex: number) => {
        if (!editMode || zoneId === 'frontline') {
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

    return (
        <>
            {loading && <Loader loading={true} />}
            <FlexBox justifyContent={'center'} gap={10}>
                <BfLevelSelect value={activeLayout.bfLevel} valueChange={handleBfLevelChange} />

                <Tabs value={tab} onChange={handleTabChange} centered sx={{ zoom: isMobile ? 0.9 : 1 }}>
                    {guildWar.layouts.map(x => {
                        return <Tab key={x.id} label={x.name} />;
                    })}
                </Tabs>
            </FlexBox>
            <FlexBox justifyContent={'center'} style={{ marginTop: 10 }}>
                <Tooltip
                    title={'Select 2 war zones whose positions you want to swap'}
                    open={editMode}
                    placement={'top'}>
                    <Button
                        variant={'contained'}
                        onClick={() => setEditMode(value => !value)}
                        color={editMode ? 'success' : 'primary'}>
                        {editMode ? 'Stop editing' : 'Edit war zones'}
                    </Button>
                </Tooltip>
                {data && <ViewPlayers guildData={data} bfLevel={activeLayout.bfLevel} />}
            </FlexBox>
            <div className="guild-war-layout-grid">
                {activeLayout.zones.map((zone, index) => (
                    <ZoneCard
                        key={index}
                        bfLevel={activeLayout.bfLevel}
                        zone={zone}
                        style={{ backgroundColor: swapZones.includes(index) ? '#409FFF' : '' }}
                        onClick={() => handleZoneClick(zone.id, index)}
                    />
                ))}
            </div>
        </>
    );
};

interface ZoneCardProps extends React.DOMAttributes<HTMLElement>, CommonProps {
    bfLevel: number;
    zone: IGWLayoutZone;
}

const ZoneCard: React.FC<ZoneCardProps> = ({ zone, bfLevel, onClick, style }) => {
    const zoneStats = GuildWarService.getZone(zone.id);
    const difficulty = zoneStats.rarityCaps[bfLevel].difficulty;
    const difficultyEnum = GuildWarService.gwData.difficulties.indexOf(difficulty) + 1;

    return (
        <Card
            style={style}
            onClick={onClick}
            sx={{
                maxWidth: 400,
                minHeight: 150,
                boxShadow: '1px 2px 3px rgba(0, 0, 0, 0.6)',
                zoom: isMobile ? 0.7 : 1,
            }}>
            <CardHeader
                titleTypographyProps={{ variant: 'h6', fontSize: isMobile ? '1rem' : undefined }}
                title={zoneStats.name}
                subheader={
                    <FlexBox gap={5}>
                        <span>{zoneStats.warScore.toString().slice(0, 2)}K</span>
                        <DifficultyImage difficulty={difficultyEnum} />
                        <span>{difficulty}</span>
                    </FlexBox>
                }
                action={
                    <IconButton>
                        <Edit fontSize="small" />
                    </IconButton>
                }
            />
            <CardContent style={{ paddingTop: 0, paddingBottom: 0 }}>
                <FlexBox style={{ flexDirection: 'column', alignItems: 'start' }}>
                    <div>1: {zone.players[0] ?? 'Empty'}</div>
                    <div>2: {zone.players[1] ?? 'Empty'}</div>
                </FlexBox>
            </CardContent>
        </Card>
    );
};
