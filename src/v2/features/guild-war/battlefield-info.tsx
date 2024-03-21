import React from 'react';
import InfoIcon from '@mui/icons-material/Info';
import { DialogActions, DialogContent, DialogTitle } from '@mui/material';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import { BfLevelTable } from 'src/v2/features/guild-war/bf-level-table';
import { GuildWarService } from 'src/v2/features/guild-war/guild-war.service';
import { isMobile } from 'react-device-detect';

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
            <InfoIcon style={{ cursor: 'pointer' }} onClick={handleClickOpen} color="primary" />
            <Dialog open={open} onClose={handleClose} maxWidth={isMobile ? 'xl' : 'lg'} fullWidth>
                <DialogTitle>Battlefield levels</DialogTitle>
                <DialogContent>
                    <BfLevelTable rows={GuildWarService.gwData.sections} />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose}>OK</Button>
                </DialogActions>
            </Dialog>
        </>
    );
};
