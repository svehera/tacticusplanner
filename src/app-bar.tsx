import React, { useContext, useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import { Badge, Divider, ListItemIcon, Menu, MenuItem, Tooltip, useMediaQuery } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { bmcLink, discordInvitationLink, isTabletOrMobileMediaQuery } from './models/constants';
import { usePopUpControls } from './hooks/pop-up-controls';
import { UserMenu } from './shared-components/user-menu/user-menu';
import ViewSwitch from './shared-components/view-switch';
import { AppBarSubMenu } from './app-bar-sub-menu';

import { StoreContext } from './reducers/store.provider';
import { WhatsNewDialog } from './shared-components/whats-new.dialog';
import { DiscordIcon } from './shared-components/icons/discord.icon';
import CampaignIcon from '@mui/icons-material/Campaign';
import ListItemText from '@mui/material/ListItemText';
import {
    inputSubMenu,
    learnSubMenu,
    menuItemById,
    MenuItemTP,
    miscMenuItems,
    planSubMenu,
    planSubMenuWeb,
} from './models/menu-items';
import IconButton from '@mui/material/IconButton';
import { FlexBox } from 'src/v2/components/flex-box';
import { BmcIcon } from 'src/shared-components/icons/bmc.icon';

const TopAppBar = () => {
    const isTabletOrMobile = useMediaQuery(isTabletOrMobileMediaQuery);
    const location = useLocation();
    const navigate = useNavigate();
    const navigationMenuControls = usePopUpControls();
    const { seenAppVersion } = useContext(StoreContext);

    const [showWhatsNew, setShowWhatsNew] = useState(false);

    const seenNewVersion = useMemo(() => {
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

    // useEffect(() => {
    //     const timeout = setTimeout(() => {
    //         if (!seenNewVersion) {
    //             setShowWhatsNew(true);
    //         }
    //     }, 3000);
    //
    //     return () => {
    //         clearTimeout(timeout);
    //     };
    // }, []);

    const nav = isTabletOrMobile ? undefined : (
        <div style={{ display: 'flex', alignItems: 'center', marginInlineEnd: 20 }}>
            <AppBarSubMenu rootLabel={'Input'} options={inputSubMenu} />

            <AppBarSubMenu rootLabel={'Plan'} options={planSubMenuWeb} />

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
                    <Badge color="secondary" variant="dot" invisible={seenNewVersion}>
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

            <MenuItem component={Link} to={bmcLink} target={'_blank'} color="inherit">
                <ListItemIcon>
                    <BmcIcon />
                </ListItemIcon>
                <ListItemText>Buy me a trooper</ListItemText>
            </MenuItem>

            {generateMenuItems([menuItemById.faq])}

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
                    <FlexBox onClick={() => navigate('./home')} style={{ cursor: 'pointer' }}>
                        <img src="/android-chrome-192x192.png" height="50px" width="50px" alt="logo" />
                        <Typography variant={isTabletOrMobile ? 'h5' : 'h4'} component="div">
                            {title}
                        </Typography>
                    </FlexBox>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        {nav}
                        <Tooltip title="Join Tacticus Planner community on Discord">
                            <IconButton color="inherit" component={Link} to={discordInvitationLink} target={'_blank'}>
                                <DiscordIcon />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Buy me a trooper">
                            <IconButton color="inherit" component={Link} to={bmcLink} target={'_blank'}>
                                <BmcIcon />
                            </IconButton>
                        </Tooltip>
                        <IconButton color="inherit" onClick={() => navigate('./faq')}>
                            <Tooltip title="Frequently Asked Questions">{menuItemById.faq.icon}</Tooltip>
                        </IconButton>
                        <ViewSwitch />
                        <Button
                            id="basic-button"
                            aria-controls={navigationMenuControls.open ? 'basic-menu' : undefined}
                            aria-haspopup="true"
                            aria-expanded={navigationMenuControls.open ? 'true' : undefined}
                            color="inherit"
                            onClick={navigationMenuControls.handleClick}>
                            <Badge color="secondary" variant="dot" invisible={seenNewVersion}>
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
