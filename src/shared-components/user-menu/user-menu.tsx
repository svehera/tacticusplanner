import { Computer as ComputerIcon, Smartphone as PhoneIcon } from '@mui/icons-material';
import DownloadIcon from '@mui/icons-material/Download';
import GroupWorkIcon from '@mui/icons-material/GroupWork';
import LoginIcon from '@mui/icons-material/Login';
import LogoutIcon from '@mui/icons-material/Logout';
import RegisterIcon from '@mui/icons-material/PersonAdd';
import SettingsBackupRestoreIcon from '@mui/icons-material/SettingsBackupRestore';
import SupervisorAccountIcon from '@mui/icons-material/SupervisorAccount';
import SyncIcon from '@mui/icons-material/Sync';
import UploadIcon from '@mui/icons-material/Upload';
import { Avatar, Badge, Divider, IconButton, ListItemIcon, Menu, MenuItem } from '@mui/material';
import Box from '@mui/material/Box';
import ListItemText from '@mui/material/ListItemText';
import { enqueueSnackbar } from 'notistack';
import React, { ChangeEvent, useContext, useRef, useState } from 'react';
import { isMobile } from 'react-device-detect';
import { usePopupManager } from 'react-popup-manager';
import { useLocation, useNavigate } from 'react-router-dom';

import { GlobalState } from 'src/models/global-state';
import { IPersonalData2 } from 'src/models/interfaces';
import { DispatchContext, StoreContext } from 'src/reducers/store.provider';
import { convertData, PersonalDataLocalStorage } from 'src/services';
import { AdminToolsDialog } from 'src/shared-components/user-menu/admin-tools-dialog';

import { useAuth, UserRole } from '@/fsd/5-shared/model';
import { usePopUpControls } from '@/fsd/5-shared/ui';

import { CharactersService } from '@/fsd/4-entities/character';

import { TacticusIntegrationDialog } from 'src/v2/features/tacticus-integration/tacticus-integration.dialog';

import { LoginUserDialog } from './login-user-dialog';
import { OverrideDataDialog } from './override-data-dialog';
import { RegisterUserDialog } from './register-user-dialog';
import { RestoreBackupDialog } from './restore-backup-dialog';

export const UserMenu = () => {
    const store = useContext(StoreContext);
    const dispatch = useContext(DispatchContext);
    const popupManager = usePopupManager();
    const { isAuthenticated, logout, username, userInfo } = useAuth();
    const [showAdminTools, setShowAdminTools] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const [showRegisterUser, setShowRegisterUser] = useState(false);
    const [showLoginUser, setShowLoginUser] = useState(false);
    const [showRestoreBackup, setShowRestoreBackup] = useState(false);
    const [showOverrideDataWarning, setShowOverrideDataWarning] = useState(false);
    const userMenuControls = usePopUpControls();
    const navigate = useNavigate();
    const location = useLocation();
    const isDesktopView = !location.pathname.includes('mobile');
    const hasRejectedGuides = userInfo.rejectedTeamsCount > 0;

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

        if (userInfo.pendingTeamsCount > 0) {
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

    const handleFileUpload = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];

        if (file) {
            const reader = new FileReader();

            reader.onload = (e: ProgressEvent<FileReader>) => {
                try {
                    const content = e.target?.result as string;
                    const personalData: IPersonalData2 = convertData(JSON.parse(content));
                    personalData.modifiedDate = new Date();

                    dispatch.setStore(new GlobalState(personalData), true, false);
                    enqueueSnackbar('Import successful', { variant: 'success' });
                } catch (error) {
                    enqueueSnackbar('Import failed. Error parsing JSON.', { variant: 'error' });
                }
            };

            reader.readAsText(file);
        }
    };

    const downloadJson = () => {
        const data = GlobalState.toStore(store);
        const jsonData = JSON.stringify(data, null, 2);

        const blob = new Blob([jsonData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        const dateTimestamp =
            typeof data.modifiedDate === 'string' ? data.modifiedDate : data.modifiedDate?.toISOString();
        const date = new Date(dateTimestamp ?? '');

        const options: Intl.DateTimeFormatOptions = {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: 'numeric',
        };
        const formattedDate = new Intl.DateTimeFormat(navigator.language, options).format(date);
        const realUsername = isAuthenticated ? username : (localStorage.getItem('userOld') ?? username);

        link.download = `${realUsername}-data-${formattedDate}.json`;
        link.click();

        URL.revokeObjectURL(url);
    };

    const restoreData = () => {
        const localStorage = new PersonalDataLocalStorage();
        const restoredData = localStorage.restoreData();
        if (!restoredData) {
            enqueueSnackbar('No Backup Found', { variant: 'error' });
        } else {
            setShowRestoreBackup(true);
        }
    };

    const openLoginForm = () => {
        const hasAnyChanges = !!store.modifiedDate;
        if (hasAnyChanges) {
            setShowOverrideDataWarning(true);
        } else {
            setShowLoginUser(true);
        }
    };

    function stringToColor(string: string) {
        let hash = 0;
        let i;

        for (i = 0; i < string.length; i += 1) {
            hash = string.charCodeAt(i) + ((hash << 5) - hash);
        }

        let color = '#';

        for (i = 0; i < 3; i += 1) {
            const value = (hash >> (i * 8)) & 0xff;
            color += `00${value.toString(16)}`.slice(-2);
        }

        return color;
    }

    function stringAvatar(name: string) {
        return {
            sx: {
                width: 32,
                height: 32,
                bgcolor: stringToColor(name),
            },
            children: `${name.slice(0, 2)}`,
        };
    }

    function syncWithTacticus(): void {
        popupManager.open(TacticusIntegrationDialog, {
            tacticusApiKey: userInfo.tacticusApiKey,
            tacticusUserId: userInfo.tacticusUserId,
            tacticusGuildApiKey: userInfo.tacticusGuildApiKey,
            initialSyncOptions: store.viewPreferences.apiIntegrationSyncOptions,
            onClose: () => {},
        });
    }

    return (
        <Box sx={{ display: 'flex', textAlign: 'center', justifyContent: 'flex-end' }}>
            <input ref={inputRef} style={{ display: 'none' }} type="file" accept=".json" onChange={handleFileUpload} />
            <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ fontSize: 16, fontWeight: 700 }}>Hi, {username}</span>
                <IconButton
                    onClick={userMenuControls.handleClick}
                    size="small"
                    sx={{ ml: 2 }}
                    aria-controls={userMenuControls.open ? 'account-menu' : undefined}
                    aria-haspopup="true"
                    aria-expanded={userMenuControls.open ? 'true' : undefined}>
                    {isAuthenticated ? (
                        <Avatar {...stringAvatar(username)}></Avatar>
                    ) : (
                        <Avatar sx={{ width: 32, height: 32 }}>TP</Avatar>
                    )}
                </IconButton>
            </div>
            <Menu
                anchorEl={userMenuControls.anchorEl}
                id="account-menu"
                open={userMenuControls.open}
                onClose={userMenuControls.handleClose}
                onClick={userMenuControls.handleClose}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}>
                {!isAuthenticated ? (
                    <div>
                        <MenuItem onClick={() => openLoginForm()}>
                            <ListItemIcon>
                                <LoginIcon />
                            </ListItemIcon>
                            <ListItemText>Login</ListItemText>
                        </MenuItem>
                        <MenuItem onClick={() => setShowRegisterUser(true)}>
                            <ListItemIcon>
                                <RegisterIcon />
                            </ListItemIcon>
                            <ListItemText>Register</ListItemText>
                        </MenuItem>
                    </div>
                ) : (
                    <MenuItem onClick={() => logout()}>
                        <ListItemIcon>
                            <LogoutIcon />
                        </ListItemIcon>
                        <ListItemText>Logout</ListItemText>
                    </MenuItem>
                )}

                <Divider />
                {isAuthenticated && (
                    <MenuItem onClick={syncWithTacticus}>
                        <ListItemIcon>
                            <SyncIcon />
                        </ListItemIcon>
                        <ListItemText>Sync via Tacticus API</ListItemText>
                    </MenuItem>
                )}

                <MenuItem onClick={() => inputRef.current?.click()}>
                    <ListItemIcon>
                        <UploadIcon />
                    </ListItemIcon>
                    <ListItemText>Import JSON</ListItemText>
                </MenuItem>
                <MenuItem onClick={() => downloadJson()}>
                    <ListItemIcon>
                        <DownloadIcon />
                    </ListItemIcon>
                    <ListItemText>Export JSON</ListItemText>
                </MenuItem>
                <Divider />
                <MenuItem onClick={() => restoreData()}>
                    <ListItemIcon>
                        <SettingsBackupRestoreIcon />
                    </ListItemIcon>
                    <ListItemText>Restore Backup</ListItemText>
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

                {[UserRole.admin, UserRole.moderator].includes(userInfo.role) && (
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
                    {userInfo.rejectedTeamsCount > 0 ? (
                        <Badge badgeContent={userInfo.rejectedTeamsCount} color="error">
                            <ListItemText>Review guides</ListItemText>
                        </Badge>
                    ) : (
                        <Badge badgeContent={userInfo.pendingTeamsCount} color="warning">
                            <ListItemText>Review guides</ListItemText>
                        </Badge>
                    )}
                </MenuItem>
            </Menu>
            <RegisterUserDialog
                isOpen={showRegisterUser}
                onClose={success => {
                    setShowRegisterUser(false);
                    setShowLoginUser(success);
                }}
            />
            <LoginUserDialog isOpen={showLoginUser} onClose={() => setShowLoginUser(false)} />
            <RestoreBackupDialog isOpen={showRestoreBackup} onClose={() => setShowRestoreBackup(false)} />
            <OverrideDataDialog
                isOpen={showOverrideDataWarning}
                onClose={(proceed: boolean) => {
                    setShowOverrideDataWarning(false);
                    if (proceed) {
                        setShowLoginUser(true);
                    }
                }}
            />
            <AdminToolsDialog
                isOpen={showAdminTools}
                onClose={() => {
                    setShowAdminTools(false);
                }}
            />
        </Box>
    );
};
