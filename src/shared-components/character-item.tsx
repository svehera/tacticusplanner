import { ICharacter2 } from '../models/interfaces';
import React, { useContext, useState } from 'react';
import { CharacterTitle } from './character-title';
import Dialog from '@mui/material/Dialog';
import { DialogActions, DialogContent, DialogTitle } from '@mui/material';
import { CharacterDetails } from '../mobile-routes/characters/character-details';
import Button from '@mui/material/Button';
import { DispatchContext } from '../reducers/store.provider';

export const CharacterItem = (props: { character: ICharacter2 }) => {
    const [open, setOpen] = useState(false);
    const [character, setCharacter] = useState(() => ({ ...props.character }));

    const dispatch = useContext(DispatchContext);
    const saveChanges = () => {
        dispatch.characters({ type: 'Update', character });
    };

    const handleClickOpen = () => {
        setCharacter({ ...props.character });
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
    };

    return (
        <div>
            <div onClick={handleClickOpen} style={{ cursor: 'pointer' }}>
                <CharacterTitle character={props.character} showLockedWithOpacity={true} />
            </div>

            <Dialog open={open} onClose={handleClose} fullWidth>
                <DialogTitle>
                    <CharacterTitle character={character} />
                </DialogTitle>
                <DialogContent>
                    <CharacterDetails character={character} characterChanges={setCharacter} />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose}>Cancel</Button>
                    <Button
                        onClick={() => {
                            saveChanges();
                            handleClose();
                        }}>
                        Save
                    </Button>
                </DialogActions>
            </Dialog>
        </div>
    );
};
