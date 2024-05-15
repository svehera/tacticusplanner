import React, { useContext, useEffect, useMemo, useState } from 'react';
import { Checkbox, FormControlLabel, Popover } from '@mui/material';
import { IMaterialFull, IMaterialRecipeIngredientFull } from '../models/interfaces';
import { StaticDataService } from '../services';
import Button from '@mui/material/Button';
import { Info, Warning } from '@mui/icons-material';
import { UpgradeImage } from './upgrade-image';
import { StoreContext } from '../reducers/store.provider';
import { MiscIcon } from './misc-icon';

import './character-upgrades.css';
import { cloneDeep, groupBy, map } from 'lodash';
import { Rank } from 'src/models/enums';

interface Props {
    characterName: string;
    rank: Rank;
    upgrades: string[];
    upgradesChanges: (upgrades: string[], updateInventory: IMaterialRecipeIngredientFull[]) => void;
}

export const CharacterUpgrades: React.FC<Props> = ({ upgradesChanges, upgrades, rank, characterName }) => {
    const { inventory } = useContext(StoreContext);

    const [formData, setFormData] = useState({
        currentUpgrades: upgrades,
        newUpgrades: [] as string[],
        originalUpgrades: upgrades,
        originalRank: rank,
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
            characterName: characterName,
            rankStart: rank,
            rankEnd: rank + 1,
            appliedUpgrades: [],
            rankPoint5: false,
            upgradesRarity: [],
        });
    }, [rank]);

    const hasDuplicateUpgrades = useMemo(() => {
        const upgrades = groupBy(possibleUpgrades.map(x => x.id));
        return Object.values(upgrades).some(x => x.length === 2);
    }, [possibleUpgrades]);

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
            const isNewUpgrade = rank !== formData.originalRank || !formData.originalUpgrades.includes(value);
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

    const topLevelUpgrades = useMemo<IMaterialFull[]>(() => {
        const newUpgrades = possibleUpgrades.filter(x => formData.newUpgrades.includes(x.id));
        let upgradesToConsider: IMaterialFull[];

        if (rank <= formData.originalRank) {
            upgradesToConsider = newUpgrades;
        } else {
            const previousRankUpgrades = StaticDataService.getUpgrades({
                characterName,
                rankStart: formData.originalRank,
                rankEnd: rank,
                appliedUpgrades: formData.originalUpgrades,
                rankPoint5: false,
                upgradesRarity: [],
            });
            upgradesToConsider = [...previousRankUpgrades, ...newUpgrades];
        }

        return upgradesToConsider;
    }, [formData.newUpgrades, rank]);

    const craftedUpgrades: IMaterialRecipeIngredientFull[] = useMemo(() => {
        const inventoryCopy = cloneDeep(inventory.upgrades);
        const crafted = topLevelUpgrades.filter(x => x.craftable);

        const filtered = crafted
            .filter(x => {
                const inventoryCount = inventoryCopy[x.id];

                if (inventoryCount >= 1) {
                    inventoryCopy[x.id]--;
                    return true;
                }

                return false;
            })
            .map(x => ({
                ...x,
                count: 1,
                priority: 1,
                characters: [],
            }));

        const grouped: IMaterialRecipeIngredientFull[] = map(groupBy(filtered, 'id'), (items, id) => ({
            ...items[0],
            count: items.length,
        }));

        return grouped;
    }, [topLevelUpgrades]);

    const updatedUpgrades = useMemo<IMaterialRecipeIngredientFull[]>(() => {
        const result = [...topLevelUpgrades];
        if (craftedUpgrades.length) {
            for (const craftedUpgrade of craftedUpgrades) {
                for (let i = 0; i < craftedUpgrade.count; i++) {
                    const upgradeEntryIndex = result.findIndex(x => x.id === craftedUpgrade.id);
                    result.splice(upgradeEntryIndex, 1);
                }
            }
        }

        return [...craftedUpgrades, ...StaticDataService.groupBaseMaterials(result)];
    }, [topLevelUpgrades]);

    useEffect(() => {
        if (updateInventory) {
            upgradesChanges(formData.currentUpgrades, updatedUpgrades);
        } else {
            upgradesChanges(formData.currentUpgrades, []);
        }
    }, [formData.currentUpgrades, updatedUpgrades, updateInventory]);

    useEffect(() => {
        if (rank === formData.originalRank) {
            setFormData({ ...formData, currentUpgrades: formData.originalUpgrades, newUpgrades: [] });
        } else {
            setFormData({ ...formData, currentUpgrades: [], newUpgrades: [] });
        }
    }, [rank]);

    return (
        <div>
            {hasDuplicateUpgrades && (
                <div className="flex-box gap3">
                    <Warning color="warning" /> Duplicated upgrades will be applied both at once
                </div>
            )}
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
                        disabled={!updatedUpgrades.length}
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
                        {updatedUpgrades.map((x, index) => (
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
