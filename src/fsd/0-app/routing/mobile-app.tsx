import { BottomNavigation, BottomNavigationAction, Paper } from '@mui/material';
import { Home, Input, School as Learn, TrackChanges as Plan } from '@mui/icons-material';

import React, { useMemo } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';

import Box from '@mui/material/Box';
import { menuItemById } from 'src/models/menu-items';
import Typography from '@mui/material/Typography';
import { FlexBox } from 'src/v2/components/flex-box';
import { Conditional } from '@/fsd/5-shared/ui';
import { useTitle } from 'src/contexts/title.context';

const MobileApp = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { headerTitle } = useTitle();

    const value = useMemo(() => {
        if (location.pathname.includes('input')) {
            return 1;
        } else if (location.pathname.includes('plan')) {
            return 2;
        } else if (location.pathname.includes('learn')) {
            return 3;
        } else {
            return 0;
        }
    }, [location.pathname]);

    const title = useMemo(() => {
        const routeSections = location.pathname.split('/');
        const menuItemId = routeSections[routeSections.length - 1];
        if (Object.hasOwn(menuItemById, menuItemId) && value !== 0) {
            return menuItemById[menuItemId as keyof typeof menuItemById].title;
        } else if (menuItemId === 'lre') {
            return headerTitle;
        } else {
            return '';
        }
    }, [location.pathname]);

    return (
        <Box sx={{ margin: 'auto', padding: 1, paddingBottom: 7 }}>
            <Conditional condition={!!title}>
                <FlexBox onClick={() => navigate('/mobile/home')} style={{ cursor: 'pointer' }}>
                    <img src="/android-chrome-192x192.png" height="50px" width="50px" alt="logo" />
                    <Typography style={{ cursor: 'pointer' }} variant={'h5'} component="div">
                        {title}
                    </Typography>
                </FlexBox>
            </Conditional>

            <div style={{ marginTop: 10 }}>
                <Outlet />
            </div>
            <Paper sx={{ position: 'fixed', bottom: 0, left: 0, right: 0, margin: 'auto', zIndex: 100 }} elevation={3}>
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
