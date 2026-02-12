import { Badge, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import IconButton from '@mui/material/IconButton';
import React from 'react';
import { isMobile } from 'react-device-detect';

import { MiscIcon } from '@/fsd/5-shared/ui/icons';

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
            <IconButton onClick={handleClickOpen} className="cursor-pointer">
                <Badge badgeContent={charactersLeft}>
                    <MiscIcon icon={'deployment'} height={30} width={30} />
                </Badge>
            </IconButton>
            <Dialog open={open} onClose={handleClose} maxWidth={'lg'} fullWidth fullScreen={isMobile}>
                <DialogTitle>Deployment status</DialogTitle>
                <div className="px-6 py-5">
                    <DialogContentText>
                        Track what characters you have deployed already in your attacks and what characters are still
                        available for deployment
                    </DialogContentText>
                </div>
                <DialogContent className="pt-0">{children}</DialogContent>
                <DialogActions>
                    <Button variant="contained" color="error" onClick={onClearAll}>
                        Reset All
                    </Button>
                    <Button onClick={handleClose}>Close</Button>
                </DialogActions>
            </Dialog>
        </>
    );
};
