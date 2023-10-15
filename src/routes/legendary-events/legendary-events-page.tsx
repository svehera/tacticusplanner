import React, { useContext, useEffect, useMemo } from 'react';
import { Popover, Tab, Tabs } from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';

import { LegendaryEventContext } from '../../contexts';
import { AunShiLegendaryEvent, ShadowSunLegendaryEvent } from '../../models/legendary-events';
import { ILegendaryEvent, IViewPreferences } from '../../models/interfaces';

import LegendaryEvent from './legendary-event';
import ViewSettings from './view-settings';
import AutoTeamsSettings from './auto-teams-settings';
import Box from '@mui/material/Box';
import { LegendaryEventEnum as LegendaryEventEnum } from '../../models/enums';
import Button from '@mui/material/Button';
import { Help } from '@mui/icons-material';
import { getDefaultLE } from '../../models/constants';
import { StoreContext } from '../../reducers/store.provider';

export const LegendaryEventPage = () => {
    const { autoTeamsPreferences, characters } = useContext(StoreContext);
    const [legendaryEvent, setLegendaryEvent] = React.useState<ILegendaryEvent>(() => getDefaultLE(characters));

    const [anchorEl, setAnchorEl] = React.useState<HTMLButtonElement | null>(null);
    const [anchorEl2, setAnchorEl2] = React.useState<HTMLButtonElement | null>(null);

    useEffect(() => {
        setLegendaryEvent(getDefaultLE(characters));
    }, [characters]);

    const handleClick2 = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl2(event.currentTarget);
    };

    const handleClose2 = () => {
        setAnchorEl2(null);
    };

    const open2 = Boolean(anchorEl2);

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const open = Boolean(anchorEl);

    const autoTeamsPriority = useMemo(() => {
        const result: string[] = [];
        if (!autoTeamsPreferences.ignoreRecommendedFirst) {
            result.push('Recommend first');
        }
        if (autoTeamsPreferences.preferCampaign) {
            result.push('Is campaign char');
        }
        if (!autoTeamsPreferences.ignoreRarity) {
            result.push('Rarity');
        }
        if (!autoTeamsPreferences.ignoreRank) {
            result.push('Rank');
        }
        result.push('Event points');

        if (!autoTeamsPreferences.ignoreRecommendedLast) {
            result.push('Recommend last');
        }

        return result;
    }, [autoTeamsPreferences]);

    return (
        <Box sx={{ paddingLeft: 2, paddingRight: 2, paddingBottom: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                <Box sx={{ bgcolor: 'background.paper' }}>
                    <Tabs value={legendaryEvent.id} scrollButtons="auto" aria-label="scrollable auto tabs example">
                        <Tab
                            label="Shadowsun 2/3 (October 15)"
                            value={LegendaryEventEnum.Shadowsun}
                            onClick={() => setLegendaryEvent(new ShadowSunLegendaryEvent(characters))}
                        />
                        <Tab
                            label="Aun Shi 3/3 (TBA)"
                            value={LegendaryEventEnum.AunShi}
                            onClick={() => setLegendaryEvent(new AunShiLegendaryEvent(characters))}
                        />
                    </Tabs>
                </Box>

                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <ViewSettings />
                    <Button variant="outlined" onClick={handleClick2}>
                        Auto-Teams <SettingsIcon />
                    </Button>
                    <Popover
                        open={open2}
                        anchorEl={anchorEl2}
                        onClose={handleClose2}
                        anchorOrigin={{
                            vertical: 'bottom',
                            horizontal: 'left',
                        }}>
                        <div style={{ margin: 20 }}>
                            <AutoTeamsSettings />
                        </div>
                    </Popover>

                    <Button onClick={handleClick} color={'inherit'}>
                        <Help />
                    </Button>
                    <Popover
                        open={open}
                        anchorEl={anchorEl}
                        onClose={handleClose}
                        anchorOrigin={{
                            vertical: 'bottom',
                            horizontal: 'left',
                        }}>
                        <div style={{ padding: 15 }}>
                            <p>Current auto-teams priority order:</p>
                            <ol>
                                {autoTeamsPriority.map(x => (
                                    <li key={x}>{x}</li>
                                ))}
                            </ol>
                        </div>
                    </Popover>
                </div>
            </div>

            <LegendaryEventContext.Provider value={legendaryEvent}>
                <LegendaryEvent key={legendaryEvent.id} />
            </LegendaryEventContext.Provider>
        </Box>
    );
};
