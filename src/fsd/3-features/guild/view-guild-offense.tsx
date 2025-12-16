import { CircularProgress, DialogActions, DialogContent, DialogTitle } from '@mui/material';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import { sum } from 'lodash';
import React from 'react';
import { isMobile } from 'react-device-detect';

import { MiscIcon } from '@/fsd/5-shared/ui/icons';

import { GuildOffenseTable } from '@/fsd/3-features/guild/guild-offense-table';
import { IGuildWarOffensePlayer } from '@/fsd/3-features/guild/guild.models';

interface Props {
    loading: boolean;
    guildWarPlayers: IGuildWarOffensePlayer[];
}

export const ViewGuildOffense: React.FC<Props> = ({ guildWarPlayers, loading }) => {
    const [open, setOpen] = React.useState(false);

    const handleClickOpen = () => {
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
    };

    return (
        <>
            <div className="flex-box gap5">
                <Button onClick={handleClickOpen} disabled={loading}>
                    View guild
                </Button>
                {loading && <CircularProgress color="primary" size={20} />}
            </div>
            <Dialog open={open} onClose={handleClose} maxWidth={isMobile ? 'xl' : 'lg'} fullWidth>
                <DialogTitle>Guild players</DialogTitle>
                <DialogContent>
                    <div className="flex-box gap5">
                        <MiscIcon icon={'warToken'} />
                        <span>
                            total war token left:{' '}
                            <b>{sum(guildWarPlayers.filter(x => x.tokensLeft > 0).map(x => x.tokensLeft))}</b>
                        </span>
                    </div>
                    <GuildOffenseTable rows={guildWarPlayers} />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose}>OK</Button>
                </DialogActions>
            </Dialog>
        </>
    );
};
