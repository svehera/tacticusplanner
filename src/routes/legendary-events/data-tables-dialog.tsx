import * as React from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import CloseIcon from '@mui/icons-material/Close';
import PointsTable from './points-table';
import { ILegendaryEvent } from '../../models/interfaces';
import { useMemo } from 'react';
import { CharactersSelection } from './legendary-events.interfaces';

export default function DataTablesDialog({
    legendaryEvent,
    short,
}: {
    legendaryEvent: ILegendaryEvent;
    short?: boolean;
}) {
    const [open, setOpen] = React.useState(false);
    const [selection, setSelection] = React.useState(CharactersSelection.All);

    const handleClickOpen = () => {
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
    };

    const title = useMemo(() => {
        switch (selection) {
            case CharactersSelection.All:
                return 'Best Characters Overall';
            case CharactersSelection.Unlocked:
                return 'Your Best Characters';
            case CharactersSelection.Selected:
                return 'Selected Teams Best';
            default:
                return 'Data Table';
        }
    }, [selection]);

    return (
        <div>
            <Button variant="contained" onClick={handleClickOpen}>
                Data Tables
            </Button>
            <Dialog fullScreen open={open} onClose={handleClose}>
                <AppBar sx={{ position: 'relative' }}>
                    <Toolbar>
                        <IconButton edge="start" color="inherit" onClick={handleClose} aria-label="close">
                            <CloseIcon />
                        </IconButton>
                        <Typography sx={{ ml: 2, flex: 1 }} variant="h6" component="div">
                            {legendaryEvent.name} - {title}
                        </Typography>
                    </Toolbar>
                </AppBar>
                <PointsTable legendaryEvent={legendaryEvent} selectionChange={setSelection} />
            </Dialog>
        </div>
    );
}
