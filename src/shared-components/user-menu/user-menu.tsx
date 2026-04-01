import { SignedIn, SignedOut, SignInButton, UserButton, useUser } from '@clerk/clerk-react';
import { convexQuery } from '@convex-dev/react-query';
import { Computer as ComputerIcon, Smartphone as PhoneIcon, Settings } from '@mui/icons-material';
import GroupWorkIcon from '@mui/icons-material/GroupWork';
import SupervisorAccountIcon from '@mui/icons-material/SupervisorAccount';
import SyncIcon from '@mui/icons-material/Sync';
import UploadIcon from '@mui/icons-material/Upload';
import { Badge, Divider, IconButton, ListItemIcon, Menu, MenuItem } from '@mui/material';
import Box from '@mui/material/Box';
import ListItemText from '@mui/material/ListItemText';
import { useQuery } from '@tanstack/react-query';
import { enqueueSnackbar } from 'notistack';
import { ChangeEvent, useContext, useRef, useState } from 'react';
import { isMobile } from 'react-device-detect';
import { usePopupManager } from 'react-popup-manager';
import { useLocation, useNavigate } from 'react-router-dom';

import { api } from '@/convex-api';
import { GlobalState } from 'src/models/global-state';
import { IPersonalData2 } from 'src/models/interfaces';
import { DispatchContext, StoreContext } from 'src/reducers/store.provider';
import { convertData } from 'src/services';
import { AdminToolsDialog } from 'src/shared-components/user-menu/admin-tools-dialog';

import { usePopUpControls } from '@/fsd/5-shared/ui';

import { TacticusIntegrationDialog } from '@/fsd/3-features/tacticus-integration/tacticus-integration.dialog';

export const UserMenu = () => {
    const store = useContext(StoreContext);
    const dispatch = useContext(DispatchContext);
    const popupManager = usePopupManager();
    const [showAdminTools, setShowAdminTools] = useState(false);
    const inputReference = useRef<HTMLInputElement>(null);
    const userMenuControls = usePopUpControls();
    const navigate = useNavigate();
    const location = useLocation();
    const isDesktopView = !location.pathname.includes('mobile');
    const { isSignedIn } = useUser();
    const { data } = useQuery(convexQuery(api.legacy_data.getLegacyData));
    const hasRejectedGuides = data && data.rejectedTeamsCount > 0;

    const navigateToDesktopView = () => {
        localStorage.setItem('preferredView', 'desktop');
        navigate('/home');
    };

    const navigateToMobileView = () => {
        localStorage.setItem('preferredView', 'mobile');
        navigate('/mobile/home');
    };

    const navigateToReviewTeams = () => {
        let tabId = 2;

        if (data?.pendingTeamsCount) {
            tabId = 3;
        }

        if (hasRejectedGuides) {
            tabId = 2;
        }

        let url = `/learn/guides?activeTab=${tabId}`;

        if (isMobile) {
            url = '/mobile' + url;
        }

        navigate(url);
    };

    const handleFileUpload = async (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];

        if (file) {
            try {
                const content = await file.text();
                const personalData: IPersonalData2 = convertData(JSON.parse(content));
                personalData.modifiedDate = new Date();

                // When we import JSON, we need to bump the local version to ensure
                // we pick it up. It should always be considered the freshest data, and
                // definitely fresher than what we have in the backend.
                dispatch.setStore(
                    {
                        ...new GlobalState(personalData),
                        __localVersion: store.__localVersion ? store.__localVersion + 1 : 1,
                    },
                    /*modified=*/ true,
                    /*reset=*/ false
                );
                enqueueSnackbar('Import successful', { variant: 'success' });
            } catch {
                enqueueSnackbar('Import failed. Error parsing JSON.', { variant: 'error' });
            }
        }
    };

    function syncWithTacticus(): void {
        popupManager.open(TacticusIntegrationDialog, {
            tacticusApiKey: data?.tacticusApiKey ?? '',
            tacticusUserId: data?.tacticusUserId ?? '',
            tacticusGuildApiKey: data?.tacticusGuildApiKey ?? '',
            onClose: () => {},
        });
    }

    return (
        <Box sx={{ display: 'flex', textAlign: 'center', justifyContent: 'flex-end' }}>
            <input ref={inputReference} className="hidden" type="file" accept=".json" onChange={handleFileUpload} />
            <div className="flex items-center">
                <IconButton
                    onClick={userMenuControls.handleClick}
                    size="small"
                    sx={{ ml: 2 }}
                    aria-controls={userMenuControls.open ? 'account-menu' : undefined}
                    aria-haspopup="true"
                    aria-expanded={userMenuControls.open ? 'true' : undefined}>
                    <Settings />
                </IconButton>
                <SignedIn>
                    <UserButton />
                </SignedIn>
                <SignedOut>
                    <SignInButton />
                </SignedOut>
            </div>
            <Menu
                anchorEl={userMenuControls.anchorEl}
                id="account-menu"
                open={userMenuControls.open}
                onClose={userMenuControls.handleClose}
                onClick={userMenuControls.handleClose}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}>
                {isSignedIn && (
                    <MenuItem onClick={syncWithTacticus}>
                        <ListItemIcon>
                            <SyncIcon />
                        </ListItemIcon>
                        <ListItemText>Sync via Tacticus API</ListItemText>
                    </MenuItem>
                )}

                <MenuItem onClick={() => inputReference.current?.click()}>
                    <ListItemIcon>
                        <UploadIcon />
                    </ListItemIcon>
                    <ListItemText>Import JSON</ListItemText>
                </MenuItem>

                <Divider />
                {isDesktopView ? (
                    <MenuItem onClick={() => navigateToMobileView()}>
                        <ListItemIcon>
                            <PhoneIcon />
                        </ListItemIcon>
                        <ListItemText>Use mobile view</ListItemText>
                    </MenuItem>
                ) : (
                    <MenuItem onClick={() => navigateToDesktopView()}>
                        <ListItemIcon>
                            <ComputerIcon />
                        </ListItemIcon>
                        <ListItemText>Use desktop view</ListItemText>
                    </MenuItem>
                )}

                <Divider />

                {data?.role && ['admin', 'moderator'].includes(data.role) && (
                    <MenuItem onClick={() => setShowAdminTools(true)}>
                        <ListItemIcon>
                            <SupervisorAccountIcon />
                        </ListItemIcon>
                        <ListItemText>Admin tools</ListItemText>
                    </MenuItem>
                )}

                <MenuItem onClick={() => navigateToReviewTeams()}>
                    <ListItemIcon>
                        <GroupWorkIcon />
                    </ListItemIcon>
                    {data && data.rejectedTeamsCount > 0 ? (
                        <Badge badgeContent={data.rejectedTeamsCount} color="error">
                            <ListItemText>Review guides</ListItemText>
                        </Badge>
                    ) : (
                        <Badge badgeContent={0} color="warning">
                            <ListItemText>Review guides</ListItemText>
                        </Badge>
                    )}
                </MenuItem>
            </Menu>
            <AdminToolsDialog
                isOpen={showAdminTools}
                onClose={() => {
                    setShowAdminTools(false);
                }}
            />
        </Box>
    );
};
