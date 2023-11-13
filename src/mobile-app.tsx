import { BottomNavigation, BottomNavigationAction, Paper } from '@mui/material';
import { Home, Input, School as Learn, TrackChanges as Plan } from '@mui/icons-material';

import React, { useEffect } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';

import Box from '@mui/material/Box';

const MobileApp = () => {
    const location = useLocation();
    const [value, setValue] = React.useState(1);

    useEffect(() => {
        if (location.pathname.includes('input')) {
            setValue(1);
        } else if (location.pathname.includes('plan')) {
            setValue(2);
        } else if (location.pathname.includes('learn')) {
            setValue(3);
        } else {
            setValue(0);
        }
    }, [location.pathname]);

    return (
        <Box sx={{ margin: 'auto', padding: 1, paddingBottom: 7 }}>
            <Outlet />
            <Paper sx={{ position: 'fixed', bottom: 0, left: 0, right: 0, margin: 'auto' }} elevation={3}>
                <BottomNavigation showLabels value={value}>
                    <BottomNavigationAction value={0} component={Link} to={'./'} label="Home" icon={<Home />} />
                    <BottomNavigationAction value={1} component={Link} to={'./input'} label="Input" icon={<Input />} />
                    <BottomNavigationAction value={2} component={Link} to={'./plan'} label="Plan" icon={<Plan />} />
                    <BottomNavigationAction value={3} component={Link} to={'./learn'} label="Learn" icon={<Learn />} />
                </BottomNavigation>
            </Paper>
        </Box>
    );
};

export default MobileApp;
