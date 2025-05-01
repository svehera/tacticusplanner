import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DownloadIcon from '@mui/icons-material/Download';
import { DialogActions, DialogContent, DialogTitle, FormControl, Input } from '@mui/material';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import IconButton from '@mui/material/IconButton';
import InputLabel from '@mui/material/InputLabel';
import { enqueueSnackbar } from 'notistack';
import React, { useState } from 'react';

import { changeUserRoleApi, getUsersApi, resetUserPasswordApi } from 'src/api/api-functions';
import { IGetUser } from 'src/api/api-interfaces';
import { formatDateWithOrdinal } from 'src/shared-logic/functions';

export const AdminToolsDialog = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
    const [resetPasswordForm, setResetPasswordForm] = useState({
        username: '',
        password: '',
    });

    const [changeRoleForm, setChangeRoleForm] = useState({
        username: '',
        role: '',
    });

    const [usersList, setUsersList] = useState<IGetUser[]>([]);

    const resetUserPassword = () => {
        resetUserPasswordApi(resetPasswordForm.username, resetPasswordForm.password)
            .then(() => {
                enqueueSnackbar('Password is reset', { variant: 'success' });
            })
            .catch(() => enqueueSnackbar('Failed to reset password', { variant: 'error' }));
    };

    const changeUserRole = () => {
        changeUserRoleApi(changeRoleForm.username, Number.parseInt(changeRoleForm.role))
            .then(() => {
                enqueueSnackbar('Role is updated', { variant: 'success' });
            })
            .catch(() => enqueueSnackbar('Failed to update role', { variant: 'error' }));
    };

    const searchUsers = () => {
        getUsersApi(resetPasswordForm.username)
            .then(result => {
                setUsersList(result.data);
                if (!result.data.length) {
                    enqueueSnackbar('No users', { variant: 'warning' });
                }
            })
            .catch(() => enqueueSnackbar('Failed to find users', { variant: 'error' }));
    };

    const downloadJson = (username: string, jsonData: string) => {
        const blob = new Blob([jsonData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;

        const options: Intl.DateTimeFormatOptions = {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: 'numeric',
        };
        const formattedDate = new Intl.DateTimeFormat(navigator.language, options).format(new Date());

        link.download = `${username}-data-${formattedDate}.json`;
        link.click();

        URL.revokeObjectURL(url);
    };

    const copyLink = (shareLink: string) => {
        if (shareLink) {
            navigator.clipboard.writeText(shareLink).then(() => enqueueSnackbar('Copied', { variant: 'success' }));
        }
    };

    const renderUser = (user: IGetUser) => {
        const createdAt = formatDateWithOrdinal(new Date(user.createdDate), true);
        const shareLink = user.shareToken
            ? location.origin + `/sharedRoster?username=${user.username}&shareToken=${user.shareToken}`
            : '';
        return (
            <div className="flex-box gap5" key={user.username}>
                <span>
                    {user.username} ({createdAt})
                </span>
                {shareLink && (
                    <IconButton onClick={() => copyLink(shareLink)} color={'inherit'}>
                        <ContentCopyIcon />
                    </IconButton>
                )}
                {!shareLink && !!user.data && (
                    <IconButton onClick={() => downloadJson(user.username, user.data!)} color={'inherit'}>
                        <DownloadIcon />
                    </IconButton>
                )}
            </div>
        );
    };

    return (
        <Dialog open={isOpen} onClose={() => onClose()} fullWidth>
            <DialogTitle>Admin tools</DialogTitle>
            <DialogContent>
                <Box>
                    <h3>Reset user password</h3>
                    <FormControl required fullWidth variant={'standard'}>
                        <InputLabel htmlFor="username-input">Username</InputLabel>
                        <Input
                            id="username-input"
                            onChange={event =>
                                setResetPasswordForm(curr => ({ ...curr, username: event.target.value }))
                            }
                        />
                    </FormControl>
                    <FormControl required fullWidth variant={'standard'}>
                        <InputLabel htmlFor="password-input">Password</InputLabel>
                        <Input
                            id="password-input"
                            onChange={event =>
                                setResetPasswordForm(curr => ({ ...curr, password: event.target.value }))
                            }
                        />
                    </FormControl>
                    <Button onClick={searchUsers}>Search users</Button>
                    <Button onClick={resetUserPassword}>Reset Password</Button>
                </Box>
                <Box>
                    <h3>Change user Role</h3>
                    <FormControl required fullWidth variant={'standard'}>
                        <InputLabel htmlFor="username-input">Username</InputLabel>
                        <Input
                            id="username-input"
                            onChange={event => setChangeRoleForm(curr => ({ ...curr, username: event.target.value }))}
                        />
                    </FormControl>
                    <FormControl required fullWidth variant={'standard'}>
                        <InputLabel htmlFor="password-input">Role (0 - User, 1 - Moderator, 2 - Admin)</InputLabel>
                        <Input
                            id="password-input"
                            onChange={event => setChangeRoleForm(curr => ({ ...curr, role: event.target.value }))}
                        />
                    </FormControl>
                    <Button onClick={changeUserRole}>Update role</Button>
                </Box>
                {!!usersList.length && <Box>{usersList.map(renderUser)}</Box>}
            </DialogContent>
            <DialogActions>
                <Button onClick={() => onClose()}>Close</Button>
            </DialogActions>
        </Dialog>
    );
};
