import React from 'react';
import AddIcon from '@mui/icons-material/Add';
import { Fab } from '@mui/material';

export const Teams = () => {
    const [openCreateTeamDialog, setOpenCreateTeamDialog] = React.useState(false);
    return (
        <>
            Teams mobile
            <Fab variant="extended" size="small" color="primary" aria-label="add">
                <AddIcon />
                New team
            </Fab>
        </>
    );
};
