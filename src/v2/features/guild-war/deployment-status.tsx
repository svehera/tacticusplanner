import React from 'react';
import { Badge, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import { isMobile } from 'react-device-detect';
import IconButton from '@mui/material/IconButton';
import { MiscIcon } from 'src/v2/components/images/misc-image';

export const DeploymentStatus: React.FC<
    React.PropsWithChildren & { charactersLeft: number; onClearAll: () => void }
> = ({ children, charactersLeft, onClearAll }) => {
    const [open, setOpen] = React.useState(false);

    const handleClickOpen = () => {
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
    };

    return (
        <>
            <IconButton onClick={handleClickOpen} style={{ cursor: 'pointer' }}>
                <Badge badgeContent={charactersLeft}>
                    <MiscIcon icon={'deployment'} height={30} width={30} />
                </Badge>
            </IconButton>
            <Dialog open={open} onClose={handleClose} maxWidth={'lg'} fullWidth fullScreen={isMobile}>
                <DialogTitle>Deployment status</DialogTitle>
                <div style={{ padding: '20px 24px' }}>
                    <DialogContentText>
                        Track what characters you have deployed already in your attacks and what characters are still
                        available for deployment
                    </DialogContentText>
                </div>
                <DialogContent style={{ paddingTop: 0 }}>{children}</DialogContent>
                <DialogActions>
                    <Button color="error" onClick={onClearAll}>
                        Clear All
                    </Button>
                    <Button onClick={handleClose}>Close</Button>
                </DialogActions>
            </Dialog>
        </>
    );
};
