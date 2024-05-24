import React, { useMemo, useState } from 'react';

import { isMobile } from 'react-device-detect';

import { DialogActions, DialogContent, DialogTitle, FormControlLabel, Grid, Switch } from '@mui/material';
import Dialog from '@mui/material/Dialog';
import Button from '@mui/material/Button';

import { IMow } from 'src/v2/features/characters/characters.models';
import { CharacterImage } from 'src/shared-components/character-image';
import { Rarity, RarityStars } from 'src/models/enums';
import { getEnumValues } from 'src/shared-logic/functions';
import { rarityToMaxStars, rarityToStars } from 'src/models/constants';
import { RarityImage } from 'src/v2/components/images/rarity-image';
import { MiscIcon } from 'src/v2/components/images/misc-image';
import { NumberInput } from 'src/v2/components/inputs/number-input';
import { RaritySelect } from 'src/shared-components/rarity-select';
import { StarsSelect } from 'src/shared-components/stars-select';

interface Props {
    mow: IMow;
    saveChanges: (mow: IMow) => void;
    isOpen: boolean;
    onClose: () => void;
}

export const EditMowDialog: React.FC<Props> = ({ mow, saveChanges, onClose, isOpen }) => {
    const [editedMow, setEditedMow] = useState(() => ({ ...mow }));

    const starsEntries = useMemo(() => {
        const minStars = rarityToStars[editedMow.rarity];
        const maxStars = rarityToMaxStars[editedMow.rarity];

        return getEnumValues(RarityStars).filter(x => (x >= minStars && x <= maxStars) || x === editedMow.stars);
    }, [editedMow.rarity]);

    const rarityEntries: number[] = getEnumValues(Rarity);

    const handleInputChange = (name: keyof IMow, value: boolean | number) => {
        setEditedMow(curr => ({
            ...curr,
            [name]: value,
        }));
    };

    return (
        <Dialog open={isOpen} onClose={onClose} fullWidth fullScreen={isMobile}>
            <DialogTitle className="flex-box gap10">
                <CharacterImage icon={mow.badgeIcon} />
                <span>{mow.name}</span>
                <RarityImage rarity={mow.rarity} />
                <MiscIcon icon={'mow'} width={22} height={25} />
            </DialogTitle>
            <DialogContent style={{ paddingTop: 20, minHeight: 200 }}>
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={6}>
                        <RaritySelect
                            label="Rarity"
                            rarityValues={rarityEntries}
                            value={editedMow.rarity}
                            valueChanges={value => handleInputChange('rarity', value)}
                        />
                    </Grid>
                    <Grid item xs={6}>
                        <StarsSelect
                            label="Stars"
                            starsValues={starsEntries}
                            value={editedMow.stars}
                            valueChanges={value => handleInputChange('stars', value)}
                        />
                    </Grid>

                    <Grid item xs={6}>
                        <FormControlLabel
                            label="Unlocked"
                            control={
                                <Switch
                                    checked={editedMow.unlocked}
                                    onChange={event => handleInputChange('unlocked', event.target.checked)}
                                />
                            }
                        />
                    </Grid>
                    <Grid item xs={6}>
                        <NumberInput
                            fullWidth
                            label="Shards"
                            value={editedMow.shards}
                            valueChange={value => handleInputChange('shards', value)}
                        />
                    </Grid>

                    {editedMow.unlocked && (
                        <>
                            <Grid item xs={6}>
                                <NumberInput
                                    fullWidth
                                    label="Primary Ability"
                                    value={editedMow.primaryAbilityLevel}
                                    valueChange={value => handleInputChange('primaryAbilityLevel', value)}
                                />
                            </Grid>
                            <Grid item xs={6}>
                                <NumberInput
                                    fullWidth
                                    label="Passive Ability"
                                    value={editedMow.secondaryAbilityLevel}
                                    valueChange={value => handleInputChange('secondaryAbilityLevel', value)}
                                />
                            </Grid>
                        </>
                    )}
                </Grid>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button variant="contained" color="success" onClick={() => saveChanges(editedMow)}>
                    Save
                </Button>
            </DialogActions>
        </Dialog>
    );
};
