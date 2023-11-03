import React, { useContext, useMemo, useState } from 'react';
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

import aunshi from './assets/legendary-events/Aunshi.json';
import ragnar from './assets/legendary-events/Ragnar.json';
import shadowsun from './assets/legendary-events/Shadowsun.json';
import { StoreContext } from './reducers/store.provider';
import { WhatsNewDialog } from './shared-components/whats-new.dialog';
import { DiscordIcon } from './shared-components/icons/discord.icon';
import CampaignIcon from '@mui/icons-material/Campaign';
import ListItemText from '@mui/material/ListItemText';
import { CharacterImage } from './shared-components/character-image';
import { Home } from '@mui/icons-material';
import TargetIcon from '@mui/icons-material/TrackChanges';
import ListIcon from '@mui/icons-material/List';
import ContactEmergencyIcon from '@mui/icons-material/ContactEmergency';
import Diversity3Icon from '@mui/icons-material/Diversity3';
import DirtyLensIcon from '@mui/icons-material/DirtyLens';
import HealthAndSafetyIcon from '@mui/icons-material/HealthAndSafety';

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
        switch (location.pathname) {
            case '/wyo':
                return 'Who You Own';
            case '/campaignsProgress':
                return 'Campaigns Progress';
            case '/le/shadowsun':
                return `Shadowsun ${shadowsun.eventStage}/3 (${shadowsun.nextEventDate})`;
            case '/le/aunshi':
                return `Aun Shi  ${aunshi.eventStage}/3 (${aunshi.nextEventDate})`;
            case '/le/ragnar':
                return `Ragnar  ${ragnar.eventStage}/3 (${ragnar.nextEventDate}) - *Some data can change`;
            case '/goals':
                return 'My Goals';
            case '/characters':
                return 'Characters';
            case '/upgrades':
                return 'Upgrades';
            case '/rankLookup':
                return 'Rank Lookup';
            case '/dailyRaids':
                return 'Daily Raids';
            case '/campaigns':
                return 'Campaigns';
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
            <AppBarSubMenu
                rootLabel={'Input'}
                options={[
                    {
                        label: 'Who You Own',
                        route: './wyo',
                    },
                    {
                        label: 'Campaigns Progress',
                        route: './campaignsProgress',
                    },
                ]}
            />

            <AppBarSubMenu
                rootLabel={'Plan'}
                options={[
                    {
                        label: 'Goals',
                        route: './goals',
                    },
                    {
                        label: 'Daily Raids',
                        route: './dailyRaids',
                    },
                    {
                        label: 'Shadowsun LE',
                        route: './le/shadowsun',
                    },
                    {
                        label: 'Aun Shi LE',
                        route: './le/aunshi',
                    },
                    {
                        label: 'Ragnar LE',
                        route: './le/ragnar',
                    },
                ]}
            />

            <AppBarSubMenu
                rootLabel={'Learn'}
                options={[
                    {
                        label: 'Characters',
                        route: './characters',
                    },
                    {
                        label: 'Upgrades',
                        route: './upgrades',
                    },
                    {
                        label: 'Rank Lookup',
                        route: './rankLookup',
                    },
                    {
                        label: 'Campaigns',
                        route: './campaigns',
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

            <MenuItem component={Link} to={'./wyo'} color="inherit">
                <ListItemIcon>
                    <ListIcon />
                </ListItemIcon>
                <ListItemText>Who You Own</ListItemText>
            </MenuItem>

            <MenuItem component={Link} to={'./campaignsProgress'} color="inherit">
                <ListItemIcon>
                    <ListIcon />
                </ListItemIcon>
                <ListItemText>Campaigns Progress</ListItemText>
            </MenuItem>

            <Divider />

            <MenuItem component={Link} to={'./goals'} color="inherit">
                <ListItemIcon>
                    <TargetIcon />
                </ListItemIcon>
                <ListItemText>Goals</ListItemText>
            </MenuItem>

            <MenuItem component={Link} to={'./dailyRaids'} color="inherit">
                <ListItemIcon>
                    <TargetIcon />
                </ListItemIcon>
                <ListItemText>Daily Raids</ListItemText>
            </MenuItem>

            <Divider />

            <MenuItem component={Link} to={'./le/shadowsun'} color="inherit">
                <ListItemIcon>
                    <CharacterImage icon={'ShadowSun.png'} imageSize={30} />
                </ListItemIcon>
                <ListItemText>Shadowsun LE</ListItemText>
            </MenuItem>

            <MenuItem component={Link} to={'./le/aunshi'} color="inherit">
                <ListItemIcon>
                    <CharacterImage icon={'Aun-shi.png'} imageSize={30} />
                </ListItemIcon>
                <ListItemText>Aun Shi LE</ListItemText>
            </MenuItem>

            <MenuItem component={Link} to={'./le/ragnar'} color="inherit">
                <ListItemIcon>
                    <CharacterImage icon={'unset.png'} imageSize={30} />
                </ListItemIcon>
                <ListItemText> Ragnar LE</ListItemText>
            </MenuItem>

            <Divider />

            <MenuItem component={Link} to={'./characters'} color="inherit">
                <ListItemIcon>
                    <Diversity3Icon />
                </ListItemIcon>
                <ListItemText>Characters</ListItemText>
            </MenuItem>
            <MenuItem component={Link} to={'./upgrades'} color="inherit">
                <ListItemIcon></ListItemIcon>
                <ListItemText>Upgrades</ListItemText>
            </MenuItem>

            <MenuItem component={Link} to={'./rankLookup'} color="inherit">
                <ListItemIcon></ListItemIcon>
                <ListItemText>RankLookup</ListItemText>
            </MenuItem>
            <MenuItem component={Link} to={'./campaigns'} color="inherit">
                <ListItemIcon></ListItemIcon>
                <ListItemText>Campaigns</ListItemText>
            </MenuItem>
            <MenuItem component={Link} to={'./dirtyDozen'} color="inherit">
                <ListItemIcon>
                    <DirtyLensIcon />
                </ListItemIcon>
                <ListItemText>Dirty Dozen</ListItemText>
            </MenuItem>

            <Divider />

            <MenuItem component={Link} to={'./'} color="inherit">
                <ListItemIcon>
                    <Home />
                </ListItemIcon>
                <ListItemText> Home/F.A.Q.</ListItemText>
            </MenuItem>
            <MenuItem component={Link} to={'./contacts'} color="inherit">
                <ListItemIcon>
                    <ContactEmergencyIcon />
                </ListItemIcon>
                <ListItemText>Contacts</ListItemText>
            </MenuItem>

            <MenuItem component={Link} to={'./ty'} color="inherit">
                <ListItemIcon>
                    <HealthAndSafetyIcon />
                </ListItemIcon>
                <ListItemText>Thank You</ListItemText>
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
