import { Backdrop, CircularProgress } from '@mui/material';
import React from 'react';

export const Loader = ({
    loading,
    loadingText = 'Please Wait. Loading...',
}: {
    loading: boolean;
    loadingText?: string;
}) =>
    loading && (
        <Backdrop sx={{ color: '#fff', zIndex: theme => theme.zIndex.drawer + 1 }} open={true}>
            {loadingText} <CircularProgress color="inherit" />
        </Backdrop>
    );
