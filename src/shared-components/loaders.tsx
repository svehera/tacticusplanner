import { Backdrop, CircularProgress } from '@mui/material';
import React from 'react';

export const Loader = ({ loading }: { loading: boolean }) => (
    <Backdrop sx={{ color: '#fff', zIndex: theme => theme.zIndex.drawer + 1 }} open={loading}>
        <CircularProgress color="inherit" />
    </Backdrop>
);
