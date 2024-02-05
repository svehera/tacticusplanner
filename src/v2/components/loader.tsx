import React from 'react';
import { Backdrop, CircularProgress } from '@mui/material';

export const Loader = ({ loading }: { loading: boolean }) => (
    <Backdrop sx={{ color: '#fff', zIndex: theme => theme.zIndex.drawer + 1 }} open={loading}>
        Please Wait. Loading... <CircularProgress color="inherit" />
    </Backdrop>
);
