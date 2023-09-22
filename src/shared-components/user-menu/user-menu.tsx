import React, { ChangeEvent, useRef, useState } from 'react';
import Box from '@mui/material/Box';
import { Avatar, Divider, IconButton, Menu, MenuItem } from '@mui/material';
import LoginIcon from '@mui/icons-material/Login';
import RegisterIcon from '@mui/icons-material/PersonAdd';
import UploadIcon from '@mui/icons-material/Upload';
import { PersonalDataService } from '../../services';
import DownloadIcon from '@mui/icons-material/Download';
import { usePopUpControls } from '../../hooks/pop-up-controls';
import { RegisterUserDialog } from './register-user-dialog';
import { LoginUserDialog } from './login-user-dialog';
import { useAuth } from '../../contexts/auth';
import { setUserDataApi } from '../../api/api-functions';
import { enqueueSnackbar } from 'notistack';
import { AxiosError } from 'axios';

export const UserMenu = () => {
    const inputRef = useRef<HTMLInputElement>(null);
    const [showRegisterUser, setShowRegisterUser] = useState(false);
    const [showLoginUser, setShowLoginUser] = useState(false);
    const userMenuControls = usePopUpControls();

    const { isAuthenticated, logout, username } = useAuth();

    const handleFileUpload = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];

        if (file) {
            const reader = new FileReader();

            reader.onload = (e: ProgressEvent<FileReader>) => {
                try {
                    const content = e.target?.result as string;
                    const personalData = JSON.parse(content);
                    PersonalDataService._data.next(personalData);
                    PersonalDataService.save();
                    setUserDataApi(personalData)
                        .then(() => enqueueSnackbar('Synced local data with server.', { variant: 'info' }))
                        .catch((err: AxiosError) => {
                            if (err.response?.status === 401) {
                                logout();
                                enqueueSnackbar('Session expired. Please re-login.', { variant: 'error' });
                            } else {
                                enqueueSnackbar('Something went wrong. Try again later', { variant: 'error' });
                            }
                        });
                    window.location = '/' as unknown as Location;
                } catch (error) {
                    enqueueSnackbar('Error parsing JSON.', { variant: 'error' });
                }
            };

            reader.readAsText(file);
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

    return (<Box sx={{ display: 'flex', textAlign: 'center', justifyContent: 'flex-end' }}>
        <input
            ref={inputRef}
            style={{ display: 'none' }}
            type="file"
            accept=".json"
            onChange={handleFileUpload}
        />
        <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ fontSize: 16, fontWeight: 700 }}>Hi, {username}</span>
            
            <IconButton
                onClick={userMenuControls.handleClick}
                size="small"
                sx={{ ml: 2 }}
                aria-controls={userMenuControls.open ? 'account-menu' : undefined}
                aria-haspopup="true"
                aria-expanded={userMenuControls.open ? 'true' : undefined}
            >
                { isAuthenticated ? (<Avatar {...stringAvatar(username)}></Avatar>) : (<Avatar  sx={{ width: 32,
                    height: 32 }}>TP</Avatar>)}
                
            </IconButton>
        </div>
        <Menu
            anchorEl={userMenuControls.anchorEl}
            id="account-menu"
            open={userMenuControls.open}
            onClose={userMenuControls.handleClose}
            onClick={userMenuControls.handleClose}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        >
            {!isAuthenticated
                ? (
                    <div>
                        <MenuItem onClick={() => setShowLoginUser(true)}>
                            <LoginIcon/> Login
                        </MenuItem>
                        <MenuItem onClick={() => setShowRegisterUser(true)}>
                            <RegisterIcon/> Register
                        </MenuItem>
                    </div>
                )
                : (
                    <MenuItem onClick={() => logout()}>
                        <LoginIcon/> Logout
                    </MenuItem>
                )
            }
            
            <Divider/>
            <MenuItem onClick={() => inputRef.current?.click()}>
                <UploadIcon/> Import
            </MenuItem>
            <MenuItem onClick={() => PersonalDataService.downloadJson()}>
                <DownloadIcon/> Export
            </MenuItem>
        </Menu>
        <RegisterUserDialog isOpen={showRegisterUser} onClose={(success) => {
            setShowRegisterUser(false);
            setShowLoginUser(success);
        }}/>
        <LoginUserDialog isOpen={showLoginUser} onClose={() => setShowLoginUser(false)}/>
    </Box>);
};