import React, { useState } from 'react';
import Dialog from '@mui/material/Dialog';
import { Backdrop, CircularProgress, DialogActions, DialogContent, DialogTitle, TextField } from '@mui/material';
import Button from '@mui/material/Button';
import { registerUser } from '../../api/api-functions';
import { AxiosError } from 'axios';
import { IErrorResponse } from '../../api/api-interfaces';
import { enqueueSnackbar } from 'notistack';

export const RegisterUserDialog = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
    const [registerForm, setRegisterForm] = useState({
        username: '',
        password: '',
        confirmPassword: ''
    });

    const [open, setOpen] = React.useState(false);

    return (
        <Dialog open={isOpen} onClose={onClose}>
            <DialogTitle>Register</DialogTitle>
            <DialogContent>
                <TextField
                    required
                    margin="dense"
                    id="username"
                    label="Username"
                    type="text"
                    fullWidth
                    variant="standard"
                    onChange={event => setRegisterForm(curr => ({ ...curr, username: event.target.value }))}
                />
                <TextField
                    required
                    margin="dense"
                    id="password"
                    label="Password"
                    type="password"
                    fullWidth
                    variant="standard"
                    onChange={event => setRegisterForm(curr => ({ ...curr, password: event.target.value }))}
                />
                <TextField
                    required
                    margin="dense"
                    id="consfirm-password"
                    label="Confirm password"
                    type="password"
                    fullWidth
                    variant="standard"
                    onChange={event => setRegisterForm(curr => ({ ...curr, confirmPassword: event.target.value }))}
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button onClick={() => {
                    if (registerForm.password !== registerForm.confirmPassword || !registerForm.password || !registerForm.username) {
                        alert('Passwords are not matching');
                        return;
                    }
                    setOpen(true);
                    registerUser(registerForm.username, registerForm.password)
                        .then(data => console.log(data))
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
