import * as React from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import CloseIcon from '@mui/icons-material/Close';
import { ILegendaryEvent } from '../../models/interfaces';
import { LeProgress } from '../../shared-components/le-progress';
import { LegendaryEvent } from '../../models/enums';

export function MyProgressDialog({ legendaryEvent }: { legendaryEvent: ILegendaryEvent}) {
    const [open, setOpen] = React.useState(false);
    const [myProgressSection, setMyProgressSection] = React.useState('Overview');
    const handleClickOpen = () => {
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
    };
    
    return (
        <div>
            <Button variant="contained" onClick={handleClickOpen}>
                My Progress
            </Button>
            <Dialog
                fullScreen
                open={open}
                onClose={handleClose}
            >
                <AppBar sx={{ position: 'relative' }}>
                    <Toolbar>
                        <IconButton
                            edge="start"
                            color="inherit"
                            onClick={handleClose}
                            aria-label="close"
                        >
                            <CloseIcon />
                        </IconButton>
                        <Typography sx={{ ml: 2, flex: 1 }} variant="h6" component="div">
                            {LegendaryEvent[legendaryEvent.id]} - My Progress - {myProgressSection}
                        </Typography>
                        <a style={{ textDecoration: 'none', color: 'white', fontWeight: 700 }} href={legendaryEvent.wikiLink} target={'_blank'} rel="noreferrer">WIKI</a>
                    </Toolbar>
                </AppBar>
                <LeProgress sectionChange={setMyProgressSection} legendaryEvent={legendaryEvent}/>
            </Dialog>
        </div>
    );
}
