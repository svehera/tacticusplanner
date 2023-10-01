import React, { useState } from 'react';
import { Link } from 'react-router-dom';

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
    const [title, setTitle] = useState('Tacticus Planner');

    const navigationMenuControls = usePopUpControls();

    const nav = isTabletOrMobile ? undefined : (
        <div style={{ display: 'flex', alignItems: 'center', marginInlineEnd: 20 }}>
            <Button
                onClick={() => setTitle('Who You Own')}
                component={Link}
                to={'./wyo'}
                color="inherit"
            >
                Who You Own
            </Button>
            
            <Button
                onClick={() => setTitle('Legendary Events')}
                component={Link}
                to={'./le'}
                color="inherit"
            >
                Legendary Events
            </Button>

            <Button
                onClick={() => setTitle('My Goals')}
                component={Link}
                to={'./goals'}
                color="inherit"
            >
                Goals
            </Button>
           
            <AppBarSubMenu setTitle={setTitle}/>
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
            }}
        >
            <MenuItem>
                <Button
                    onClick={() => setTitle('Who You Own')}
                    component={Link}
                    to={'./wyo'}
                    color="inherit"
                >
                    Who You Own
                </Button>
            </MenuItem>
            <MenuItem>
                <Button
                    onClick={() => setTitle('Legendary Events')}
                    component={Link}
                    to={'./le'}
                    color="inherit"
                >
                    Legendary Events
                </Button>
            </MenuItem>

            <MenuItem>
                <Button
                    onClick={() => setTitle('My Goals')}
                    component={Link}
                    to={'./goals'}
                    color="inherit"
                >
                    Goals
                </Button>
            </MenuItem>

            <Divider/>

            <MenuItem>
                <Button
                    onClick={() => setTitle('Characters')}
                    component={Link}
                    to={'./characters'}
                    color="inherit"
                >
                    Characters
                </Button>
            </MenuItem>
            <MenuItem>
                <Button
                    onClick={() => setTitle('Dirty Dozen')}
                    component={Link}
                    to={'./dirtyDozen'}
                    color="inherit"
                >
                    Dirty Dozen
                </Button>
            </MenuItem>

            <Divider/>

            <MenuItem>
                <Button
                    onClick={() => setTitle('Tacticus Planner')}
                    component={Link}
                    to={'./'}
                    color="inherit"
                >
                    Home/F.A.Q.
                </Button>
            </MenuItem>
            <MenuItem>
                <Button
                    onClick={() => setTitle('Contacts')}
                    component={Link}
                    to={'./contacts'}
                    color="inherit"
                >
                    Contacts
                </Button>
            </MenuItem>

            <MenuItem>
                <Button
                    onClick={() => setTitle('Thank You Page')}
                    component={Link}
                    to={'./ty'}
                    color="inherit"
                >
                    Thank You
                </Button>
            </MenuItem>
        </Menu>
    );

    return (
        <Box sx={{ flexGrow: 1 }}>
            <AppBar position="static">
                <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant={isTabletOrMobile ? 'h5' : 'h4'} component="div">
                        {title}
                    </Typography>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        {nav}
                        <ViewSwitch/>
                        <Button
                            id="basic-button"
                            aria-controls={
                                navigationMenuControls.open ? 'basic-menu' : undefined
                            }
                            aria-haspopup="true"
                            aria-expanded={navigationMenuControls.open ? 'true' : undefined}
                            color="inherit"
                            onClick={navigationMenuControls.handleClick}
                        >
                            <MenuIcon/>
                        </Button>
                        <UserMenu/>
                        {navigationMenu}
                    </div>
                </Toolbar>
            </AppBar>
        </Box>
    );
};

export default TopAppBar;
