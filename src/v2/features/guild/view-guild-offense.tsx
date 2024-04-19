import React from 'react';
import { CircularProgress, DialogActions, DialogContent, DialogTitle } from '@mui/material';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import { isMobile } from 'react-device-detect';
import { IGuildWarOffensePlayer } from 'src/v2/features/guild/guild.models';
import { GuildOffenseTable } from 'src/v2/features/guild/guild-offense-table';
import { MiscIcon } from 'src/v2/components/images/misc-image';
import { sum } from 'lodash';

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
