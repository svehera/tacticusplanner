import { ArrowBack, ArrowForward } from '@mui/icons-material';
import { DialogActions, DialogContent, DialogTitle, IconButton } from '@mui/material';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import React, { useContext, useEffect, useState } from 'react';
import { isMobile } from 'react-device-detect';

// eslint-disable-next-line import-x/no-internal-modules
import { DispatchContext, StoreContext } from '@/reducers/store.provider';

import { numberToThousandsString, numberToThousandsStringOld } from '@/fsd/5-shared/lib';
import { AccessibleTooltip, Conditional } from '@/fsd/5-shared/ui';
import { MiscIcon } from '@/fsd/5-shared/ui/icons';

import { CharacterTitle, ICharacter2 } from '@/fsd/4-entities/character';
import { CharactersPowerService, CharactersValueService } from '@/fsd/4-entities/unit';
import { IUpgradeRecipe } from '@/fsd/4-entities/upgrade';

import { CharacterDetails } from './character-details';

interface Properties {
    character: ICharacter2;
    isOpen: boolean;
    onClose: () => void;
    showNextUnit?: () => void;
    showPreviousUnit?: () => void;
}

const CharacterItemDialogFunction: React.FC<Properties> = properties => {
    const { viewPreferences } = useContext(StoreContext);
    const [character, setCharacter] = useState(() => ({ ...properties.character }));
    const [inventoryUpdate, setInventoryUpdate] = useState<IUpgradeRecipe[]>([]);

    const dispatch = useContext(DispatchContext);
    const saveChanges = () => {
        dispatch.characters({ type: 'Update', character });
        if (inventoryUpdate.length > 0) {
            dispatch.inventory({
                type: 'DecrementUpgradeQuantity',
                upgrades: inventoryUpdate.map(x => ({ id: x.id, count: x.count })),
            });
        }
    };

    const power = CharactersPowerService.getCharacterPower(character);
    const bsValue = CharactersValueService.getCharacterValue(character);

    useEffect(() => {
        setCharacter(properties.character);
    }, [properties.character]);

    return (
        <Dialog open={properties.isOpen} onClose={properties.onClose} fullScreen={isMobile}>
            <DialogTitle className="flex-box between">
                {properties.showPreviousUnit && (
                    <IconButton
                        onClick={() => {
                            saveChanges();
                            properties.showPreviousUnit!();
                        }}>
                        <ArrowBack />
                    </IconButton>
                )}

                <div
                    className="flex-box gap10"
                    style={{
                        flexDirection: isMobile ? 'column' : 'row',
                    }}>
                    <CharacterTitle character={character} hideRarity hideRank />
                    <Conditional condition={viewPreferences.showBsValue}>
                        <AccessibleTooltip title={numberToThousandsStringOld(bsValue)}>
                            <div className="flex">
                                <MiscIcon icon={'blackstone'} height={20} width={15} />{' '}
                                {numberToThousandsString(bsValue)}
                            </div>
                        </AccessibleTooltip>
                    </Conditional>
                    <Conditional condition={viewPreferences.showPower}>
                        <AccessibleTooltip title={numberToThousandsStringOld(power)}>
                            <div className="flex">
                                <MiscIcon icon={'power'} height={20} width={15} /> {numberToThousandsString(power)}
                            </div>
                        </AccessibleTooltip>
                    </Conditional>
                </div>
                {properties.showNextUnit && (
                    <IconButton
                        onClick={() => {
                            saveChanges();
                            properties.showNextUnit!();
                        }}>
                        <ArrowForward />
                    </IconButton>
                )}
            </DialogTitle>
            <DialogContent className="pt-5">
                <CharacterDetails
                    character={character}
                    updateInventoryChanges={setInventoryUpdate}
                    characterChanges={setCharacter}
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={properties.onClose}>Cancel</Button>
                <Button
                    onClick={() => {
                        saveChanges();
                        properties.onClose();
                    }}>
                    Save
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export const CharacterItemDialog = React.memo(CharacterItemDialogFunction);
