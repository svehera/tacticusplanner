import HelpIcon from '@mui/icons-material/Help';
import { DialogActions, DialogContent, DialogTitle } from '@mui/material';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import IconButton from '@mui/material/IconButton';
import React from 'react';
import { isMobile } from 'react-device-detect';

import { BfLevelTable } from 'src/v2/features/guild-war/bf-level-table';
import { GuildWarService } from 'src/v2/features/guild-war/guild-war.service';

export const BattlefieldInfo: React.FC = () => {
    const [open, setOpen] = React.useState(false);

    const handleClickOpen = () => {
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
    };

    return (
        <>
            <IconButton onClick={handleClickOpen}>
                <HelpIcon className="cursor-pointer" color="primary" />
            </IconButton>
            <Dialog open={open} onClose={handleClose} maxWidth={isMobile ? 'xl' : 'lg'} fullWidth>
                <DialogTitle>Battlefield levels</DialogTitle>
                <DialogContent>
                    <BfLevelTable rows={GuildWarService.gwData.zones} />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose}>OK</Button>
                </DialogActions>
            </Dialog>
        </>
    );
};
