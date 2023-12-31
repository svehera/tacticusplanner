﻿import React, { useContext, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import { Badge, Divider, ListItemIcon, Menu, MenuItem, useMediaQuery } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { discordInvitationLink, isTabletOrMobileMediaQuery } from './models/constants';
import { usePopUpControls } from './hooks/pop-up-controls';
import { UserMenu } from './shared-components/user-menu/user-menu';
import ViewSwitch from './shared-components/view-switch';
import { AppBarSubMenu } from './app-bar-sub-menu';

import { StoreContext } from './reducers/store.provider';
import { WhatsNewDialog } from './shared-components/whats-new.dialog';
import { DiscordIcon } from './shared-components/icons/discord.icon';
import CampaignIcon from '@mui/icons-material/Campaign';
import ListItemText from '@mui/material/ListItemText';
import { inputSubMenu, learnSubMenu, menuItemById, MenuItemTP, miscMenuItems, planSubMenu } from './models/menu-items';

const TopAppBar = () => {
    const isTabletOrMobile = useMediaQuery(isTabletOrMobileMediaQuery);
    const location = useLocation();
    const navigate = useNavigate();
    const navigationMenuControls = usePopUpControls();
    const { seenAppVersion } = useContext(StoreContext);

    const [showWhatsNew, setShowWhatsNew] = useState(false);

    const hasNewVersion = useMemo(() => {
        const currentAppVersion = localStorage.getItem('appVersion');
        return currentAppVersion === seenAppVersion;
    }, [seenAppVersion]);

    const title = useMemo(() => {
        const routeSections = location.pathname.split('/');
        const menuItemId = routeSections[routeSections.length - 1];
        if (Object.hasOwn(menuItemById, menuItemId)) {
            return menuItemById[menuItemId as keyof typeof menuItemById].title;
        } else {
            return 'Tacticus Planner';
        }
    }, [location.pathname]);

    const nav = isTabletOrMobile ? undefined : (
        <div style={{ display: 'flex', alignItems: 'center', marginInlineEnd: 20 }}>
            <AppBarSubMenu rootLabel={'Input'} options={inputSubMenu} />

            <AppBarSubMenu rootLabel={'Plan'} options={planSubMenu} />

            <AppBarSubMenu rootLabel={'Learn'} options={learnSubMenu} />
        </div>
    );

    const generateMenuItems = (items: MenuItemTP[]) =>
        items.map(item => (
            <MenuItem key={item.label} component={Link} to={item.routeWeb} color="inherit">
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText>{item.label}</ListItemText>
            </MenuItem>
        ));

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
            <MenuItem color="inherit" onClick={() => setShowWhatsNew(true)}>
                <ListItemIcon>
                    <Badge color="secondary" variant="dot" invisible={hasNewVersion}>
                        <CampaignIcon />
                    </Badge>
                </ListItemIcon>
                <ListItemText>{"What's new"}</ListItemText>
            </MenuItem>

            <MenuItem component={Link} to={discordInvitationLink} target={'_blank'} color="inherit">
                <ListItemIcon>
                    <DiscordIcon />
                </ListItemIcon>
                <ListItemText>Discord</ListItemText>
            </MenuItem>

            <Divider />

            {generateMenuItems(inputSubMenu)}

            <Divider />

            {generateMenuItems(planSubMenu)}

            <Divider />

            {generateMenuItems(learnSubMenu)}

            <Divider />

            {generateMenuItems(miscMenuItems)}
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
                        onClick={() => navigate('./home')}>
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
                            <Badge color="secondary" variant="dot" invisible={hasNewVersion}>
                                <MenuIcon />
                            </Badge>
                        </Button>
                        <UserMenu />
                        {navigationMenu}
                    </div>
                </Toolbar>
            </AppBar>
            <WhatsNewDialog isOpen={showWhatsNew} onClose={() => setShowWhatsNew(false)} />
        </Box>
    );
};

export default TopAppBar;
