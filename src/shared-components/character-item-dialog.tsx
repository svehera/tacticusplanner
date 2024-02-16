import React, { useContext, useState } from 'react';

import { isMobile } from 'react-device-detect';

import { DialogActions, DialogContent, DialogTitle } from '@mui/material';
import Dialog from '@mui/material/Dialog';
import Button from '@mui/material/Button';

import { CharactersPowerService } from 'src/v2/features/characters/characters-power.service';
import { CharactersValueService } from 'src/v2/features/characters/characters-value.service';

import { ICharacter2, IMaterialRecipeIngredientFull } from '../models/interfaces';
import { CharacterTitle } from './character-title';
import { CharacterDetails } from '../mobile-routes/characters/character-details';
import { DispatchContext } from '../reducers/store.provider';
import { MiscIcon } from './misc-icon';

export const CharacterItemDialog = (props: { character: ICharacter2; isOpen: boolean; onClose: () => void }) => {
    const [character, setCharacter] = useState(() => ({ ...props.character }));
    const [inventoryUpdate, setInventoryUpdate] = useState<IMaterialRecipeIngredientFull[]>([]);

    const dispatch = useContext(DispatchContext);
    const saveChanges = () => {
        dispatch.characters({ type: 'Update', character });
        if (inventoryUpdate.length) {
            dispatch.inventory({
                type: 'DecrementUpgradeQuantity',
                upgrades: inventoryUpdate.map(x => ({ id: x.id, count: x.count })),
            });
        }
    };

    return (
        <Dialog open={props.isOpen} onClose={props.onClose} fullScreen={isMobile}>
            <DialogTitle>
                <div
                    style={{
                        display: 'flex',
                        flexDirection: isMobile ? 'column' : 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                    }}>
                    <CharacterTitle character={character} />
                    <div style={{ display: 'flex' }}>
                        <MiscIcon icon={'blackstone'} height={20} width={15} />{' '}
                        {CharactersValueService.getCharacterValue(character).toLocaleString().replace(/,/g, ' ')}
                    </div>
                    <div style={{ display: 'flex' }}>
                        <MiscIcon icon={'power'} height={20} width={15} />{' '}
                        {CharactersPowerService.getCharacterPower(character).toLocaleString().replace(/,/g, ' ')}
                    </div>
                </div>
            </DialogTitle>
            <DialogContent style={{ paddingTop: 20 }}>
                <CharacterDetails
                    character={character}
                    characterChanges={(character, updateInventory) => {
                        setCharacter(character);
                        setInventoryUpdate(updateInventory);
                    }}
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={props.onClose}>Cancel</Button>
                <Button
                    onClick={() => {
                        saveChanges();
                        props.onClose();
                    }}>
                    Save
                </Button>
            </DialogActions>
        </Dialog>
    );
};
