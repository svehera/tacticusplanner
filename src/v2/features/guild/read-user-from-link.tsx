import { DialogActions, DialogContent, DialogTitle, TextField } from '@mui/material';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import { enqueueSnackbar } from 'notistack';
import React, { ChangeEvent, useCallback, useRef } from 'react';
import readXlsxFile from 'read-excel-file';

import { IGuildMember } from 'src/models/interfaces';

interface Props {
    onImport: (guildUser: IGuildMember) => void;
}

export const ImportUserLink: React.FC<Props> = ({ onImport }) => {
    const [open, setOpen] = React.useState(false);
    const [user, setUser] = React.useState<IGuildMember>({ username: '', shareToken: '', index: -1 });

    const handleClickOpen = () => {
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
        setUser({ username: '', shareToken: '', index: -1 });
    };

    const handleAdd = () => {
        onImport(user);
        handleClose();
    };

    const onShareLinkChange = useCallback((change: ChangeEvent<HTMLInputElement>) => {
        const url = new URL(change.target.value);
        const params = new URLSearchParams(url.search);
        setUser({ username: params.get('username') ?? '', shareToken: params.get('shareToken') ?? '', index: 0 });
    }, []);

    return (
        <>
            <Button onClick={handleClickOpen}>Import link</Button>
            <Dialog open={open} onClose={handleClose} fullWidth>
                <DialogTitle>Import via share link</DialogTitle>
                <DialogContent>
                    <ol>
                        <li>
                            Ask your guildmates to enable roster sharing on the Who You Own page and send you link to it
                        </li>
                        <li>Paste the link in the input below and click add</li>
                    </ol>
                    <TextField label="Share link" variant="outlined" onChange={onShareLinkChange} />
                    <div className="flex-box column start gap5">
                        <span>
                            Username: <b>{user.username}</b>
                        </span>
                        <span>
                            Share token: <b>{user.shareToken}</b>
                        </span>
                    </div>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose}>Close</Button>
                    <Button onClick={handleAdd}>Add</Button>
                </DialogActions>
            </Dialog>
        </>
    );
};
