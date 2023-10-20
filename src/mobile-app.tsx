import { BottomNavigation, BottomNavigationAction, Paper } from '@mui/material';
import ListIcon from '@mui/icons-material/List';
import { Home } from '@mui/icons-material';
import TargetIcon from '@mui/icons-material/TrackChanges';
import LegendIcon from '@mui/icons-material/LegendToggle';

import React, { useEffect } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';

import Box from '@mui/material/Box';

const MobileApp = () => {
    const location = useLocation();
    const [value, setValue] = React.useState(1);

    useEffect(() => {
        switch (location.pathname) {
            case '/mobile/wyo': {
                setValue(1);
                break;
            }
            case '/mobile/goals': {
                setValue(2);
                break;
            }
            case '/mobile/le/shadowsun':
            case '/mobile/le/aunshi':
            case '/mobile/le/ragnar':
            case '/mobile/events': {
                setValue(3);
                break;
            }
            default: {
                setValue(0);
                break;
            }
        }
    }, [location.pathname]);

    return (
        <Box sx={{ margin: 'auto', padding: 1, paddingBottom: 7 }}>
            <Outlet />
            <Paper sx={{ position: 'fixed', bottom: 0, left: 0, right: 0, margin: 'auto' }} elevation={3}>
                <BottomNavigation showLabels value={value}>
                    <BottomNavigationAction
                        value={1}
                        component={Link}
                        to={'./wyo'}
                        label="Characters"
                        icon={<ListIcon />}
                    />
                    <BottomNavigationAction value={0} component={Link} to={'./'} label="Home" icon={<Home />} />
                    <BottomNavigationAction
                        value={2}
                        component={Link}
                        to={'./goals'}
                        label="Goals"
                        icon={<TargetIcon />}
                    />
                    <BottomNavigationAction
                        value={3}
                        component={Link}
                        to={'./events'}
                        label="Events"
                        icon={<LegendIcon />}
                    />
                </BottomNavigation>
            </Paper>
        </Box>
    );
};

export default MobileApp;
