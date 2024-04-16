import React from 'react';
import HelpIcon from '@mui/icons-material/Help';
import { DialogActions, DialogContent, DialogTitle } from '@mui/material';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import { BfLevelTable } from 'src/v2/features/guild-war/bf-level-table';
import { GuildWarService } from 'src/v2/features/guild-war/guild-war.service';
import { isMobile } from 'react-device-detect';
import IconButton from '@mui/material/IconButton';
import { IGuildRostersResponse } from 'src/v2/features/guild/guild.models';
import { PlayersTable } from 'src/v2/features/guild/players-table';

interface Props {
    guildData: IGuildRostersResponse;
    bfLevel: number;
}

export const ViewPlayers: React.FC<Props> = ({ guildData }) => {
    const [open, setOpen] = React.useState(false);

    const handleClickOpen = () => {
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
    };

    return (
        <>
            <Button onClick={handleClickOpen}>View players</Button>
            <Dialog open={open} onClose={handleClose} maxWidth={isMobile ? 'xl' : 'lg'} fullWidth>
                <DialogTitle>Guild players</DialogTitle>
                <DialogContent>
                    <PlayersTable data={guildData} />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose}>OK</Button>
                </DialogActions>
            </Dialog>
        </>
    );
};
