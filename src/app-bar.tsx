import React, { useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import { Divider, Menu, MenuItem, useMediaQuery } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { isTabletOrMobileMediaQuery } from './models/constants';
import { usePopUpControls } from './hooks/pop-up-controls';
import { UserMenu } from './shared-components/user-menu/user-menu';
import ViewSwitch from './shared-components/view-switch';
import { AppBarSubMenu } from './app-bar-sub-menu';

const TopAppBar = () => {
    const isTabletOrMobile = useMediaQuery(isTabletOrMobileMediaQuery);
    const location = useLocation();
    const navigate = useNavigate();
    const navigationMenuControls = usePopUpControls();

    const title = useMemo(() => {
        switch (location.pathname) {
            case '/wyo':
                return 'Who You Own';
            case '/le/shadowsun':
                return 'Shadowsun 2/3 (October 15)';
            case '/le/aunshi':
                return 'Aun Shi 3/3 (TBA)';
            case '/goals':
                return 'My Goals';
            case '/characters':
                return 'Characters';
            case '/dirtyDozen':
                return 'Dirty Dozen';
            case '/contacts':
                return 'Contacts';
            case '/ty':
                return 'Thank You Page';
            default: {
                return 'Tacticus Planner';
            }
        }
    }, [location.pathname]);

    const nav = isTabletOrMobile ? undefined : (
        <div style={{ display: 'flex', alignItems: 'center', marginInlineEnd: 20 }}>
            <Button component={Link} to={'./wyo'} color="inherit">
                Who You Own
            </Button>

            {/*<Button component={Link} to={'./le'} color="inherit">*/}
            {/*    Legendary Events*/}
            {/*</Button>*/}
            <AppBarSubMenu
                rootLabel={'Legendary Events'}
                options={[
                    {
                        label: 'Shadowsun',
                        route: './le/shadowsun',
                    },
                    {
                        label: 'Aun Shi',
                        route: './le/aunshi',
                    },
                    {
                        label: 'Ragnar',
                        route: './le/ragnar',
                    },
                ]}
            />

            <Button component={Link} to={'./goals'} color="inherit">
                Goals
            </Button>

            <AppBarSubMenu
                rootLabel={'TABLES'}
                options={[
                    {
                        label: 'Characters',
                        route: './characters',
                    },
                    {
                        label: 'Dirty Dozen',
                        route: './dirtyDozen',
                    },
                ]}
            />
        </div>
    );

    const navigationMenu = (
        <Menu
            id="basic-menu"
            anchorEl={navigationMenuControls.anchorEl}
            open={navigationMenuControls.open}
            onClose={navigationMenuControls.handleClose}
            onClick={navigationMenuControls.handleClose}
            MenuListProps={{
                'aria-labelledby': 'basic-button',
            }}>
            <MenuItem component={Link} to={'./wyo'} color="inherit">
                Who You Own
            </MenuItem>
            <MenuItem component={Link} to={'./le'} color="inherit">
                Legendary Events
            </MenuItem>

            <MenuItem component={Link} to={'./goals'} color="inherit">
                Goals
            </MenuItem>

            <Divider />

            <MenuItem component={Link} to={'./characters'} color="inherit">
                Characters
            </MenuItem>
            <MenuItem component={Link} to={'./dirtyDozen'} color="inherit">
                Dirty Dozen
            </MenuItem>

            <Divider />

            <MenuItem component={Link} to={'./'} color="inherit">
                Home/F.A.Q.
            </MenuItem>
            <MenuItem component={Link} to={'./contacts'} color="inherit">
                Contacts
            </MenuItem>

            <MenuItem component={Link} to={'./ty'} color="inherit">
                Thank You
            </MenuItem>
        </Menu>
    );

    return (
        <Box sx={{ flexGrow: 1 }}>
            <AppBar position="static">
                <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography
                        style={{ cursor: 'pointer' }}
                        variant={isTabletOrMobile ? 'h5' : 'h4'}
                        component="div"
                        onClick={() => navigate('./')}>
                        {title}
                    </Typography>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        {nav}
                        <ViewSwitch />
                        <Button
                            id="basic-button"
                            aria-controls={navigationMenuControls.open ? 'basic-menu' : undefined}
                            aria-haspopup="true"
                            aria-expanded={navigationMenuControls.open ? 'true' : undefined}
                            color="inherit"
                            onClick={navigationMenuControls.handleClick}>
                            <MenuIcon />
                        </Button>
                        <UserMenu />
                        {navigationMenu}
                    </div>
                </Toolbar>
            </AppBar>
        </Box>
    );
};

export default TopAppBar;
