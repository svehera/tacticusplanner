import React, { useContext, useState } from 'react';
import Dialog from '@mui/material/Dialog';
import { DialogActions, DialogContent, DialogTitle, FormControl, Input } from '@mui/material';
import Button from '@mui/material/Button';

import Box from '@mui/material/Box';

import { DispatchContext } from '../../reducers/store.provider';
import { enqueueSnackbar } from 'notistack';
import { GlobalState } from '../../models/global-state';
import { defaultData } from '../../models/constants';
import InputLabel from '@mui/material/InputLabel';
import { UserRole } from 'src/models/enums';
import { changeUserRoleApi, resetUserPasswordApi } from 'src/api/api-functions';

export const AdminToolsDialog = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
    const [resetPasswordForm, setResetPasswordForm] = useState({
        username: '',
        password: '',
    });

    const [changeRoleForm, setChangeRoleForm] = useState({
        username: '',
        role: '',
    });

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
            </DialogContent>
            <DialogActions>
                <Button onClick={() => onClose()}>Close</Button>
            </DialogActions>
        </Dialog>
    );
};
