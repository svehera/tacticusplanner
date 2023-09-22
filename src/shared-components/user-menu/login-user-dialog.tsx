import React, { useState } from 'react';
import Dialog from '@mui/material/Dialog';
import { Backdrop, CircularProgress, DialogActions, DialogContent, DialogTitle, TextField } from '@mui/material';
import Button from '@mui/material/Button';
import { loginUser } from '../../api/api-functions';
import { useAuth } from '../../contexts/auth';
import { AxiosError } from 'axios';
import { IErrorResponse } from '../../api/api-interfaces';
import { enqueueSnackbar } from 'notistack';

export const LoginUserDialog = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
    const [loginForm, setLoginForm] = useState({
        username: '',
        password: '',
    });
    const [open, setOpen] = React.useState(false);
    
    const { login } = useAuth();
    
    return (
        <Dialog open={isOpen} onClose={onClose}>
            <DialogTitle>Login</DialogTitle>
            <DialogContent>
                <TextField
                    required
                    margin="dense"
                    id="username"
                    label="Username"
                    type="text"
                    fullWidth
                    variant="standard"
                    onChange={event => setLoginForm(curr => ({ ...curr, username: event.target.value }))}
                />
                <TextField
                    required
                    margin="dense"
                    id="password"
                    label="Password"
                    type="password"
                    fullWidth
                    variant="standard"
                    onChange={event => setLoginForm(curr => ({ ...curr, password: event.target.value }))}
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button disabled={!loginForm.username || !loginForm.password} onClick={() => {
                    setOpen(true);
                    loginUser(loginForm.username, loginForm.password)
                        .then(data => {
                            login(data.data.accessToken);
                            onClose();
                        })
                        .catch((err: AxiosError<IErrorResponse>) => {
                            if (err.response?.status === 401) {
                                enqueueSnackbar('Session expired. Please re-login.', { variant: 'error' });
                            } else {
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