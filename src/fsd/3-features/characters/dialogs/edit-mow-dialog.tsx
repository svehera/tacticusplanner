import { ArrowBack, ArrowForward } from '@mui/icons-material';
import { DialogActions, DialogContent, DialogTitle, FormControlLabel, Grid, IconButton, Switch } from '@mui/material';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import React, { useMemo, useState } from 'react';
import { isMobile } from 'react-device-detect';

// eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { rarityToMaxStars, rarityToStars } from 'src/models/constants';
// eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { getEnumValues } from 'src/shared-logic/functions';

import { RarityStars, Rarity, Alliance } from '@/fsd/5-shared/model';
import { StarsSelect, RaritySelect } from '@/fsd/5-shared/ui';
import { MiscIcon, UnitShardIcon } from '@/fsd/5-shared/ui/icons';
// eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { RarityIcon } from '@/fsd/5-shared/ui/icons/rarity.icon';
// eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { NumberInput } from '@/fsd/5-shared/ui/input/number-input';

// eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { MowUpgrades } from '@/fsd/4-entities/mow/mow-upgrades';
// eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { MowUpgradesUpdate } from '@/fsd/4-entities/mow/mow-upgrades-update';

// eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { IMow2 } from '@/fsd/3-features/characters/characters.models';

interface Props {
    mow: IMow2;
    saveChanges: (mow: IMow2) => void;
    isOpen: boolean;
    onClose: () => void;
    showNextUnit?: (mow: IMow2) => void;
    showPreviousUnit?: (mow: IMow2) => void;
    inventory: Record<string, number>;
    inventoryUpdate: (value: Record<string, number>) => void;
}

export const EditMowDialog: React.FC<Props> = ({
    mow,
    saveChanges,
    onClose,
    isOpen,
    showPreviousUnit,
    showNextUnit,
    inventory,
    inventoryUpdate,
}) => {
    const [editedMow, setEditedMow] = useState(() => ({ ...mow }));

    const starsEntries = useMemo(() => {
        const minStars = rarityToStars[editedMow.rarity as Rarity];
        const maxStars = rarityToMaxStars[editedMow.rarity as Rarity];

        return getEnumValues(RarityStars).filter(x => x >= minStars && x <= maxStars);
    }, [editedMow.rarity]);

    const rarityEntries: number[] = getEnumValues(Rarity);

    const handleInputChange = (name: keyof IMow2, value: boolean | number) => {
        setEditedMow(curr => ({
            ...curr,
            [name]: value,
        }));
    };

    return (
        <Dialog open={isOpen} onClose={onClose} fullWidth fullScreen={isMobile}>
            <DialogTitle className="flex-box between">
                {showPreviousUnit && (
                    <IconButton onClick={() => showPreviousUnit(editedMow)}>
                        <ArrowBack />
                    </IconButton>
                )}
                <div className="flex-box gap10">
                    <UnitShardIcon icon={mow.roundIcon} />
                    <span>{mow.name}</span>
                    <RarityIcon rarity={mow.rarity} />
                    <MiscIcon icon={'mow'} width={22} height={25} />
                </div>
                {showNextUnit && (
                    <IconButton onClick={() => showNextUnit(editedMow)}>
                        <ArrowForward />
                    </IconButton>
                )}
            </DialogTitle>
            <DialogContent className="min-h-50 pt-5">
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

                    <Grid item xs={12}>
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
                            max={1000}
                            value={editedMow.shards}
                            valueChange={value => handleInputChange('shards', value)}
                        />
                    </Grid>
                    <Grid item xs={6}>
                        <NumberInput
                            fullWidth
                            label="Mythic Shards"
                            max={1000}
                            value={editedMow.mythicShards}
                            valueChange={value => handleInputChange('mythicShards', value)}
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
                                    label="Secondary Ability"
                                    value={editedMow.secondaryAbilityLevel}
                                    valueChange={value => handleInputChange('secondaryAbilityLevel', value)}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <MowUpgrades
                                    mowId={editedMow.snowprintId}
                                    alliance={editedMow.alliance as Alliance}
                                    primaryLevel={editedMow.primaryAbilityLevel}
                                    secondaryLevel={editedMow.secondaryAbilityLevel}
                                />
                                <MowUpgradesUpdate
                                    mowId={editedMow.snowprintId}
                                    inventory={inventory}
                                    currPrimaryLevel={editedMow.primaryAbilityLevel}
                                    currSecondaryLevel={editedMow.secondaryAbilityLevel}
                                    originalPrimaryLevel={mow.primaryAbilityLevel}
                                    originalSecondaryLevel={mow.secondaryAbilityLevel}
                                    inventoryDecrement={inventoryUpdate}
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
