import React from 'react';
import { Backdrop, CircularProgress } from '@mui/material';

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
