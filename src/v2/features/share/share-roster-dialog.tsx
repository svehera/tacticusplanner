﻿import AddIcon from '@mui/icons-material/Add';
import CancelIcon from '@mui/icons-material/Cancel';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import RefreshIcon from '@mui/icons-material/Refresh';
import { DialogActions, DialogContent, DialogTitle, TextField } from '@mui/material';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import { enqueueSnackbar } from 'notistack';
import React from 'react';
import { isMobile } from 'react-device-detect';

import { useAuth } from '@/fsd/5-shared/model';
import { LoaderWithText } from '@/fsd/5-shared/ui';

import { createShareToken, refreshShareToken, removeShareToken } from './share-roster.endpoints';

export const ShareRosterDialog = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
    const [loading, setLoading] = React.useState(false);

    const { shareToken, username, setUser } = useAuth();

    const shareRoute = (isMobile ? '/mobile' : '') + `/sharedRoster?username=${username}&shareToken=${shareToken}`;
    const shareLink = shareToken ? location.origin + shareRoute : undefined;

    const copyLink = () => {
        if (shareLink) {
            navigator.clipboard.writeText(shareLink).then(r => enqueueSnackbar('Copied', { variant: 'success' }));
        }
    };

    const generateLink = () => {
        const confirmed = confirm(
            'Users that have access to the link will be able to view your "Who You Own" page in readonly mode. Are you sure?'
        );
        if (confirmed) {
            setLoading(true);

            createShareToken()
                .then(response => setUser(response.data?.username ?? '', response.data?.shareToken))
                .finally(() => setLoading(false));
        }
    };

    const refreshLink = () => {
        const confirmed = confirm(
            'Existing link will stop working and new link will be created instead. Are you sure?'
        );

        if (confirmed) {
            setLoading(true);

            refreshShareToken()
                .then(response => setUser(response.data?.username ?? '', response.data?.shareToken))
                .finally(() => setLoading(false));
        }
    };

    const revokeLink = () => {
        const confirmed = confirm('Existing link will be removed and  stop working. Are you sure?');

        if (confirmed) {
            setLoading(true);

            removeShareToken()
                .then(() => setUser(username, ''))
                .finally(() => setLoading(false));
        }
    };

    return (
        <Dialog open={isOpen} onClose={onClose} fullWidth>
            <DialogTitle>Share Settings</DialogTitle>
            <DialogContent>
                {shareLink ? (
                    <>
                        <span>Your share token:</span>{' '}
                        <TextField disabled={true} value={shareToken} fullWidth></TextField>
                        <span>Your share link:</span>{' '}
                        <TextField disabled={true} value={shareLink} fullWidth></TextField>{' '}
                        <div style={{ marginTop: 5 }}>
                            <Button onClick={() => copyLink()} color={'inherit'}>
                                <ContentCopyIcon /> Copy
                            </Button>
                            <Button onClick={() => refreshLink()}>
                                <RefreshIcon /> Refresh
                            </Button>
                            <Button onClick={() => revokeLink()} color={'error'}>
                                <CancelIcon /> Revoke
                            </Button>
                        </div>
                    </>
                ) : (
                    <>
                        {/* eslint-disable-next-line react/no-unescaped-entities */}
                        <div>Share link to your "Who You Own" page in readonly mode</div>
                        <Button onClick={() => generateLink()} variant={'outlined'}>
                            <AddIcon /> Generate Link
                        </Button>
                    </>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Close</Button>
            </DialogActions>
            <LoaderWithText loading={loading} />
        </Dialog>
    );
};
