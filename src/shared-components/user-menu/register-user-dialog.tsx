import React, { useState } from 'react';
import Dialog from '@mui/material/Dialog';
import {
    Backdrop,
    CircularProgress,
    DialogActions,
    DialogContent,
    DialogTitle, 
    FormControl,
    FormHelperText, 
    Input
} from '@mui/material';
import Button from '@mui/material/Button';
import { registerUser } from '../../api/api-functions';
import { AxiosError } from 'axios';
import { IErrorResponse } from '../../api/api-interfaces';
import { enqueueSnackbar } from 'notistack';
import InputLabel from '@mui/material/InputLabel';
import Box from '@mui/material/Box';

export const RegisterUserDialog = ({ isOpen, onClose }: { isOpen: boolean, onClose: (success: boolean) => void }) => {
    const [registerForm, setRegisterForm] = useState({
        username: '',
        password: '',
        confirmPassword: ''
    });

    const [open, setOpen] = React.useState(false);
    const usernamePattern = /^[a-zA-Z0-9_-]{3,20}$/;

    return (
        <Dialog open={isOpen} onClose={onClose}>
            <DialogTitle>Register</DialogTitle>
            <DialogContent>
                <Box component="form" id="registration-form" onSubmit={event => event.preventDefault()}>
                    <FormControl required fullWidth variant={'standard'}>
                        <InputLabel htmlFor="username-input">Username</InputLabel>
                        <Input id="username-input" inputProps={{ pattern: usernamePattern }} autoComplete="off" onChange={event => setRegisterForm(curr => ({ ...curr, username: event.target.value }))} />
                        <FormHelperText id="username-helper-text">Should be between 3 to 20 characters long. Only [a-zA-Z0-9_-] characters are allowed.</FormHelperText>
                    </FormControl>
                    <FormControl required fullWidth variant={'standard'}>
                        <InputLabel htmlFor="password-input">Password</InputLabel>
                        <Input id="password-input" type="password" autoComplete="new-password" onChange={event => setRegisterForm(curr => ({ ...curr, password: event.target.value }))} />
                        <FormHelperText id="password-helper-text">Should be between 5 to 64 characters long.</FormHelperText>
                    </FormControl>
                    <FormControl required fullWidth variant={'standard'}>
                        <InputLabel htmlFor="confirm-password-input">Confirm password</InputLabel>
                        <Input id="confirm-password-input" type="password" autoComplete="new-password" onChange={event => setRegisterForm(curr => ({ ...curr, confirmPassword: event.target.value }))} />
                    </FormControl>
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={() => onClose(false)}>Cancel</Button>
                <Button form="registration-form" type="submit" onClick={() => {
                    if (!registerForm.password || !registerForm.username) {
                        alert('Populate all required fields.');
                        return;
                    }
                    
                    if (!usernamePattern.test(registerForm.username)) {
                        alert('Username should be between 3 to 20 characters long. Only [a-zA-Z0-9_-] characters are allowed.');
                        return;
                    }

                    if (registerForm.password.length < 5 || registerForm.password.length > 64) {
                        alert('Password should be between 5 to 64 characters long.');
                        return;
                    }
                    
                    if (registerForm.password !== registerForm.confirmPassword) {
                        alert('Passwords are not matching.');
                        return;
                    }
                    setOpen(true);
                    registerUser(registerForm.username, registerForm.password)
                        .then(() => {
                            onClose(true);
                            enqueueSnackbar(registerForm.username + ' is successfully registered. Use your username and password to login.', { variant: 'success' });
                        })
                        .catch((err: AxiosError<IErrorResponse>) => {
                            if (err.response?.status === 401) {
                                enqueueSnackbar('Session expired. Please re-login.', { variant: 'error' });
                            } else if (err.response?.status === 400) {
                                alert(err.response.data.message);
                            }
                            else {
                                enqueueSnackbar('Something went wrong. Try again later', { variant: 'error' });
                            }
                        })
                        .finally(() => setOpen(false))
                    ;
                }}>Submit</Button>
            </DialogActions>
            <Backdrop
                sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
                open={open}
            >
                <CircularProgress color="inherit" />
            </Backdrop>
        </Dialog>
    );
};
