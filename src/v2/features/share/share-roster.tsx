﻿import ShareIcon from '@mui/icons-material/Share';
import { Badge, Tooltip } from '@mui/material';
import IconButton from '@mui/material/IconButton';
import React from 'react';

import { ShareRosterDialog } from './share-roster-dialog';

export const ShareRoster = ({ isRosterShared }: { isRosterShared: boolean }) => {
    const [openShare, setOpenShare] = React.useState(false);
    return (
        <>
            <Tooltip title={'Share your roster'} placement={'top'}>
                <Badge badgeContent={'✅︎'} color={'success'} invisible={!isRosterShared}>
                    <IconButton onClick={() => setOpenShare(true)}>
                        <ShareIcon />
                    </IconButton>
                </Badge>
            </Tooltip>

            <ShareRosterDialog isOpen={openShare} onClose={() => setOpenShare(false)} />
        </>
    );
};
