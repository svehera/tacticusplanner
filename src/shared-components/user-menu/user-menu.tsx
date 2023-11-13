import React, { ChangeEvent, useContext, useRef, useState } from 'react';
import Box from '@mui/material/Box';
import { Avatar, Divider, IconButton, ListItemIcon, Menu, MenuItem } from '@mui/material';
import LoginIcon from '@mui/icons-material/Login';
import LogoutIcon from '@mui/icons-material/Logout';
import RegisterIcon from '@mui/icons-material/PersonAdd';
import UploadIcon from '@mui/icons-material/Upload';
import SettingsBackupRestoreIcon from '@mui/icons-material/SettingsBackupRestore';
import { convertData, PersonalDataLocalStorage } from '../../services';
import DownloadIcon from '@mui/icons-material/Download';
import { usePopUpControls } from '../../hooks/pop-up-controls';
import { RegisterUserDialog } from './register-user-dialog';
import { LoginUserDialog } from './login-user-dialog';
import { useAuth } from '../../contexts/auth';
import { enqueueSnackbar } from 'notistack';
import { DispatchContext, StoreContext } from '../../reducers/store.provider';
import { IPersonalData2 } from '../../models/interfaces';
import { GlobalState } from '../../models/global-state';
import { RestoreBackupDialog } from './restore-backup-dialog';
import ListItemText from '@mui/material/ListItemText';
import { OverrideDataDialog } from './override-data-dialog';

export const UserMenu = () => {
    const store = useContext(StoreContext);
    const { setStore } = useContext(DispatchContext);
    const inputRef = useRef<HTMLInputElement>(null);
    const [showRegisterUser, setShowRegisterUser] = useState(false);
    const [showLoginUser, setShowLoginUser] = useState(false);
    const [showRestoreBackup, setShowRestoreBackup] = useState(false);
    const [showOverrideDataWarning, setShowOverrideDataWarning] = useState(false);
    const userMenuControls = usePopUpControls();

    const { isAuthenticated, logout, username } = useAuth();

    const handleFileUpload = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];

        if (file) {
            const reader = new FileReader();

            reader.onload = (e: ProgressEvent<FileReader>) => {
                try {
                    const content = e.target?.result as string;
                    const personalData: IPersonalData2 = convertData(JSON.parse(content));

                    setStore(new GlobalState(personalData), true, false);
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
        link.download = `v${data.schemaVersion}-tp-data-${dateTimestamp}.json`;
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

        /* eslint-disable no-bitwise */
        for (i = 0; i < string.length; i += 1) {
            hash = string.charCodeAt(i) + ((hash << 5) - hash);
        }

        let color = '#';

        for (i = 0; i < 3; i += 1) {
            const value = (hash >> (i * 8)) & 0xff;
            color += `00${value.toString(16)}`.slice(-2);
        }
        /* eslint-enable no-bitwise */

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
                <MenuItem onClick={() => inputRef.current?.click()}>
                    <ListItemIcon>
                        <UploadIcon />
                    </ListItemIcon>
                    <ListItemText>Import</ListItemText>
                </MenuItem>
                <MenuItem onClick={() => downloadJson()}>
                    <ListItemIcon>
                        <DownloadIcon />
                    </ListItemIcon>
                    <ListItemText>Export</ListItemText>
                </MenuItem>
                <Divider />
                <MenuItem onClick={() => restoreData()}>
                    <ListItemIcon>
                        <SettingsBackupRestoreIcon />
                    </ListItemIcon>
                    <ListItemText>Restore Backup</ListItemText>
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
        </Box>
    );
};
