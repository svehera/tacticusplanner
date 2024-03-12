import React, { useContext, useEffect, useMemo } from 'react';
import { Popover } from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';

import ViewSettings from './view-settings';
import AutoTeamsSettings from './auto-teams-settings';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import { Help } from '@mui/icons-material';
import { StoreContext } from '../../reducers/store.provider';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { isMobile } from 'react-device-detect';

export const LegendaryEventPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { autoTeamsPreferences, viewPreferences } = useContext(StoreContext);

    const [anchorEl, setAnchorEl] = React.useState<HTMLButtonElement | null>(null);
    const [anchorEl2, setAnchorEl2] = React.useState<HTMLButtonElement | null>(null);

    useEffect(() => {
        if (location.pathname.endsWith('le') || location.pathname.endsWith('le/')) {
            navigate('/le/ragnar');
        }
    }, [location.pathname]);

    const handleClick2 = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl2(event.currentTarget);
    };

    const handleClose2 = () => {
        setAnchorEl2(null);
    };

    const open2 = Boolean(anchorEl2);

    const handleClick = (event: React.UIEvent<HTMLButtonElement>) => {
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
        if (!autoTeamsPreferences.ignoreRank) {
            result.push('Rank');
        }
        if (!autoTeamsPreferences.ignoreRarity) {
            result.push('Rarity');
        }
        result.push('Event points');

        if (!autoTeamsPreferences.ignoreRecommendedLast) {
            result.push('Recommend last');
        }

        return result;
    }, [autoTeamsPreferences]);

    return (
        <Box sx={{ paddingLeft: 2, paddingRight: 2, paddingBottom: 0 }}>
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    margin: '10px 0',
                    gap: 10,
                    flexDirection: isMobile ? 'column' : 'row',
                }}>
                <ViewSettings preset={'lre'} />
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <Button disabled={!viewPreferences.autoTeams} variant="outlined" onClick={handleClick2}>
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
                        <div style={{ margin: 20, width: 300 }}>
                            <AutoTeamsSettings />
                        </div>
                    </Popover>

                    <Button disabled={!viewPreferences.autoTeams} onClick={handleClick} color={'inherit'}>
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

            <Outlet />
        </Box>
    );
};
