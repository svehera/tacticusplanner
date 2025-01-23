import React, { useContext, useEffect, useState } from 'react';

import { isMobile } from 'react-device-detect';

import { DialogActions, DialogContent, DialogTitle, IconButton } from '@mui/material';
import Dialog from '@mui/material/Dialog';
import Button from '@mui/material/Button';

import { CharactersPowerService } from 'src/v2/features/characters/characters-power.service';
import { CharactersValueService } from 'src/v2/features/characters/characters-value.service';

import { ICharacter2 } from '../models/interfaces';
import { CharacterTitle } from './character-title';
import { CharacterDetails } from '../mobile-routes/characters/character-details';
import { DispatchContext, StoreContext } from '../reducers/store.provider';
import { MiscIcon } from 'src/v2/components/images/misc-image';
import { Conditional } from 'src/v2/components/conditional';
import { numberToThousandsString, numberToThousandsStringOld } from 'src/v2/functions/number-to-thousands-string';
import { AccessibleTooltip } from 'src/v2/components/tooltip';
import { ArrowBack, ArrowForward } from '@mui/icons-material';
import { IUpgradeRecipe } from 'src/v2/features/goals/goals.models';

interface Props {
    character: ICharacter2;
    isOpen: boolean;
    onClose: () => void;
    showNextUnit?: () => void;
    showPreviousUnit?: () => void;
}

const CharacterItemDialogFn: React.FC<Props> = props => {
    const { viewPreferences } = useContext(StoreContext);
    const [character, setCharacter] = useState(() => ({ ...props.character }));
    const [inventoryUpdate, setInventoryUpdate] = useState<IUpgradeRecipe[]>([]);

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

    const power = CharactersPowerService.getCharacterPower(character);
    const bsValue = CharactersValueService.getCharacterValue(character);

    useEffect(() => {
        setCharacter(props.character);
    }, [props.character]);

    return (
        <Dialog open={props.isOpen} onClose={props.onClose} fullScreen={isMobile}>
            <DialogTitle className="flex-box between">
                {props.showPreviousUnit && (
                    <IconButton
                        onClick={() => {
                            saveChanges();
                            props.showPreviousUnit!();
                        }}>
                        <ArrowBack />
                    </IconButton>
                )}

                <div
                    className="flex-box gap10"
                    style={{
                        flexDirection: isMobile ? 'column' : 'row',
                    }}>
                    <CharacterTitle character={character} />
                    <Conditional condition={viewPreferences.showBsValue}>
                        <AccessibleTooltip title={numberToThousandsStringOld(bsValue)}>
                            <div style={{ display: 'flex' }}>
                                <MiscIcon icon={'blackstone'} height={20} width={15} />{' '}
                                {numberToThousandsString(bsValue)}
                            </div>
                        </AccessibleTooltip>
                    </Conditional>
                    <Conditional condition={viewPreferences.showPower}>
                        <AccessibleTooltip title={numberToThousandsStringOld(power)}>
                            <div style={{ display: 'flex' }}>
                                <MiscIcon icon={'power'} height={20} width={15} /> {numberToThousandsString(power)}
                            </div>
                        </AccessibleTooltip>
                    </Conditional>
                </div>
                {props.showNextUnit && (
                    <IconButton
                        onClick={() => {
                            saveChanges();
                            props.showNextUnit!();
                        }}>
                        <ArrowForward />
                    </IconButton>
                )}
            </DialogTitle>
            <DialogContent style={{ paddingTop: 20 }}>
                <CharacterDetails
                    character={character}
                    updateInventoryChanges={setInventoryUpdate}
                    characterChanges={setCharacter}
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

export const CharacterItemDialog = React.memo(CharacterItemDialogFn);
