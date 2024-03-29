﻿import React, { useContext, useEffect, useMemo, useState } from 'react';
import { Checkbox, FormControlLabel, Popover } from '@mui/material';
import { ICharacter2, IMaterialFull, IMaterialRecipeIngredientFull } from '../models/interfaces';
import { StaticDataService } from '../services';
import Button from '@mui/material/Button';
import { Info } from '@mui/icons-material';
import { UpgradeImage } from './upgrade-image';
import { StoreContext } from '../reducers/store.provider';
import { MiscIcon } from './misc-icon';

import './character-upgrades.css';

export const CharacterUpgrades = ({
    upgradesChanges,
    character,
}: {
    character: ICharacter2;
    upgradesChanges: (upgrades: string[], updateInventory: IMaterialRecipeIngredientFull[]) => void;
}) => {
    const { inventory } = useContext(StoreContext);

    const [formData, setFormData] = useState({
        currentUpgrades: character.upgrades,
        newUpgrades: [] as string[],
        originalUpgrades: character.upgrades,
        originalRank: character.rank,
    });

    const [anchorEl, setAnchorEl] = React.useState<HTMLButtonElement | null>(null);
    const [updateInventory, setUpdateInventory] = React.useState<boolean>(false);

    const handleClick = (event: React.UIEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const open = Boolean(anchorEl);

    const possibleUpgrades = useMemo(() => {
        return StaticDataService.getUpgrades({
            id: character.name,
            rankStart: character.rank,
            rankEnd: character.rank + 1,
            appliedUpgrades: [],
            rankPoint5: false,
        });
    }, [character.rank]);

    const healthUpgrades = useMemo(() => possibleUpgrades.filter(x => x.stat === 'Health'), [possibleUpgrades]);
    const damageUpgrades = useMemo(() => possibleUpgrades.filter(x => x.stat === 'Damage'), [possibleUpgrades]);
    const armourUpgrades = useMemo(() => possibleUpgrades.filter(x => x.stat === 'Armour'), [possibleUpgrades]);

    const unknownUpgrades = useMemo(
        () => possibleUpgrades.filter(x => x.stat !== 'Health' && x.stat !== 'Damage' && x.stat !== 'Armour'),
        [possibleUpgrades]
    );

    const handleUpgradeChange = (checked: boolean, value: string) => {
        let currentUpgrades: string[];
        let newUpgrades: string[];

        if (checked) {
            currentUpgrades = [...formData.currentUpgrades, value];
            const isNewUpgrade = character.rank !== formData.originalRank || !formData.originalUpgrades.includes(value);
            newUpgrades = isNewUpgrade ? [...formData.newUpgrades, value] : formData.newUpgrades;
        } else {
            currentUpgrades = formData.currentUpgrades.filter(x => x !== value);
            newUpgrades = formData.newUpgrades.filter(x => x !== value);
        }

        if (!newUpgrades.length) {
            setUpdateInventory(false);
        }

        setFormData({
            ...formData,
            currentUpgrades,
            newUpgrades,
        });
    };

    const baseMaterials = useMemo<IMaterialRecipeIngredientFull[]>(() => {
        const newUpgrades = possibleUpgrades.filter(x => formData.newUpgrades.includes(x.id));
        let upgradesToConsider: IMaterialFull[];

        if (character.rank <= formData.originalRank) {
            upgradesToConsider = newUpgrades;
        } else {
            const previousRankUpgrades = StaticDataService.getUpgrades({
                id: character.name,
                rankStart: formData.originalRank,
                rankEnd: character.rank,
                appliedUpgrades: formData.originalUpgrades,
                rankPoint5: false,
            });
            upgradesToConsider = [...previousRankUpgrades, ...newUpgrades];
        }

        return StaticDataService.groupBaseMaterials(upgradesToConsider);
    }, [formData.newUpgrades, character.rank]);

    useEffect(() => {
        if (updateInventory) {
            upgradesChanges(formData.currentUpgrades, baseMaterials);
        } else {
            upgradesChanges(formData.currentUpgrades, []);
        }
    }, [formData.currentUpgrades, baseMaterials, updateInventory]);

    useEffect(() => {
        if (character.rank === formData.originalRank) {
            setFormData({ ...formData, currentUpgrades: formData.originalUpgrades, newUpgrades: [] });
        } else {
            setFormData({ ...formData, currentUpgrades: [], newUpgrades: [] });
        }
    }, [character.rank]);

    return (
        <div>
            <h4>Applied upgrades</h4>
            <div style={{ display: 'flex' }}>
                <div className="upgrades-column">
                    <MiscIcon icon={'health'} height={30} />
                    {healthUpgrades.map((x, index) => (
                        <UpgrageControl
                            key={x.id + index}
                            material={x}
                            checked={formData.currentUpgrades.includes(x.id)}
                            checkedChanges={value => handleUpgradeChange(value, x.id)}
                        />
                    ))}
                </div>
                <div className="upgrades-column">
                    <MiscIcon icon={'damage'} />
                    {damageUpgrades.map((x, index) => (
                        <UpgrageControl
                            key={x.id + index}
                            material={x}
                            checked={formData.currentUpgrades.includes(x.id)}
                            checkedChanges={value => handleUpgradeChange(value, x.id)}
                        />
                    ))}
                </div>
                <div className="upgrades-column">
                    <MiscIcon icon={'armour'} height={30} />
                    {armourUpgrades.map((x, index) => (
                        <UpgrageControl
                            key={x.id + index}
                            material={x}
                            checked={formData.currentUpgrades.includes(x.id)}
                            checkedChanges={value => handleUpgradeChange(value, x.id)}
                        />
                    ))}
                </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
                {unknownUpgrades.map((x, index) => (
                    <UpgrageControl
                        key={x.id + index}
                        material={x}
                        checked={formData.currentUpgrades.includes(x.id)}
                        checkedChanges={value => handleUpgradeChange(value, x.id)}
                    />
                ))}
            </div>
            <hr />
            <FormControlLabel
                control={
                    <Checkbox
                        disabled={!baseMaterials.length}
                        checked={updateInventory}
                        onChange={event => setUpdateInventory(event.target.checked)}
                        inputProps={{ 'aria-label': 'controlled' }}
                    />
                }
                label={'Update inventory'}
            />
            <Button disabled={!updateInventory} onClick={handleClick} color={'primary'}>
                <Info />
            </Button>
            <Popover
                open={open}
                anchorEl={anchorEl}
                onClose={handleClose}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'left',
                }}>
                <div style={{ padding: 15 }}>
                    <p>Inventory after update:</p>
                    <ul style={{ padding: 0 }}>
                        {baseMaterials.map((x, index) => (
                            <li
                                key={x.id + index}
                                style={{
                                    listStyleType: 'none',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 10,
                                    paddingBottom: 10,
                                }}>
                                <UpgradeImage material={x.label} rarity={x.rarity} iconPath={x.iconPath} />{' '}
                                {inventory.upgrades[x.id] ?? 0} - {x.count} ={' '}
                                {(inventory.upgrades[x.id] ?? 0) - x.count < 0
                                    ? 0
                                    : (inventory.upgrades[x.id] ?? 0) - x.count}
                            </li>
                        ))}
                    </ul>
                </div>
            </Popover>
        </div>
    );
};

const UpgrageControl = ({
    material,
    checked,
    checkedChanges,
}: {
    material: IMaterialFull;
    checked: boolean;
    checkedChanges: (value: boolean) => void;
}) => {
    return (
        <FormControlLabel
            control={
                <Checkbox
                    checked={checked}
                    onChange={event => checkedChanges(event.target.checked)}
                    inputProps={{ 'aria-label': 'controlled' }}
                />
            }
            label={
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        opacity: checked ? 1 : 0.5,
                    }}>
                    <UpgradeImage material={material.label} iconPath={material.iconPath} rarity={material.rarity} />
                </div>
            }
        />
    );
};
