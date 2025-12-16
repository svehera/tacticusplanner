import { DialogActions, DialogContent, DialogTitle } from '@mui/material';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import { enqueueSnackbar } from 'notistack';
import React, { ChangeEvent, useRef } from 'react';
import readXlsxFile, { Schema } from 'read-excel-file';

// eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { IGuildMember } from 'src/models/interfaces';

interface Props {
    onImport: (guildUsers: IGuildMember[]) => void;
}

export const ImportGuildExcel: React.FC<Props> = ({ onImport }) => {
    const [open, setOpen] = React.useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleClickOpen = () => {
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
    };

    const handleFileUpload = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];

        if (file) {
            const schema: Schema<IGuildMember> = {
                Username: {
                    prop: 'username',
                    type: String,
                },
                ShareToken: {
                    prop: 'shareToken',
                    type: String,
                },
                InGameName: {
                    prop: 'inGameName',
                    type: String,
                },
                InGameUserId: {
                    prop: 'userId',
                    type: String,
                },
            };

            readXlsxFile<IGuildMember>(file, { schema }).then(({ rows, errors }) => {
                if (rows.length) {
                    onImport(rows);
                    enqueueSnackbar('Import successful', { variant: 'success' });
                } else if (!rows.length && errors.length) {
                    enqueueSnackbar('Import failed. Error parsing Excel gile.', { variant: 'error' });
                }
                handleClose();
            });
        }
    };

    return (
        <>
            <Button onClick={handleClickOpen}>Import Excel</Button>
            <Dialog open={open} onClose={handleClose} fullWidth>
                <DialogTitle>Import Guild Excel</DialogTitle>
                <DialogContent>
                    <ol>
                        <li>Ask your guildmates to enable roster sharing on the Who You Own page</li>
                        <li>
                            Create a copy of this
                            <a
                                href="https://docs.google.com/spreadsheets/d/1ZGKUpskbO-p6HWvYs4MTZKae1YML5RFfD_DBDGIMdTQ/edit?usp=sharing"
                                target="_blank"
                                rel="noreferrer">
                                {' '}
                                spreadsheet
                            </a>
                        </li>
                        <li>
                            Share the copied spreadsheet with guildmates and ask them to populate the Username and Share
                            Token from the planner app
                        </li>
                        <li>Download the spreadsheet in the XLSX format</li>
                        <li>Chose downloaded file in the file picker below</li>
                    </ol>
                    <input ref={inputRef} type="file" accept=".xlsx" onChange={handleFileUpload} />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose}>Close</Button>
                </DialogActions>
            </Dialog>
        </>
    );
};
