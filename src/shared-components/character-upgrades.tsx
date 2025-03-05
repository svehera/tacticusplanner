import React, { useContext, useEffect, useMemo, useState } from 'react';
import { Checkbox, FormControlLabel, Popover } from '@mui/material';
import Button from '@mui/material/Button';
import { Info, Warning } from '@mui/icons-material';
import { UpgradeImage } from './upgrade-image';
import { StoreContext } from '../reducers/store.provider';
import { MiscIcon } from 'src/v2/components/images/misc-image';

import './character-upgrades.css';
import { cloneDeep, groupBy } from 'lodash';
import { Rank } from 'src/models/enums';
import { IBaseUpgrade, ICraftedUpgrade, IUpgradeRecipe } from 'src/v2/features/goals/goals.models';
import { UpgradesService } from 'src/v2/features/goals/upgrades.service';
import { UpgradeControl } from 'src/shared-components/upgrade-control';
import { StatCalculatorService } from 'src/v2/functions/stat-calculator-service';
import { StaticDataService } from 'src/services';
import { ICharacter2 } from 'src/models/interfaces';

interface Props {
    character: ICharacter2;
    rank: Rank;
    upgrades: string[];
    upgradesChanges: (upgrades: string[], updateInventory: IUpgradeRecipe[]) => void;
}

export const CharacterUpgrades: React.FC<Props> = ({ upgradesChanges, upgrades, rank, character }) => {
    const { inventory } = useContext(StoreContext);

    const [formData, setFormData] = useState({
        currentUpgrades: upgrades,
        newUpgrades: [] as string[],
        originalUpgrades: upgrades,
        originalRank: rank,
    });

    const [anchorEl, setAnchorEl] = React.useState<HTMLButtonElement | null>(null);
    const [updateInventory, setUpdateInventory] = React.useState<boolean>(true);

    const handleClick = (event: React.UIEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const open = Boolean(anchorEl);

    const possibleUpgrades: Array<IBaseUpgrade | ICraftedUpgrade> = useMemo(() => {
        const [rankUpgrades] = UpgradesService.getCharacterUpgradeRank({
            unitName: character.name,
            rankStart: rank,
            rankEnd: rank + 1,
            appliedUpgrades: [],
            rankPoint5: false,
            upgradesRarity: [],
        });

        return rankUpgrades.upgrades.map(x => UpgradesService.getUpgrade(x));
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

    const topLevelUpgrades = useMemo<Array<IBaseUpgrade | ICraftedUpgrade>>(() => {
        const newUpgrades = possibleUpgrades.filter(x => formData.newUpgrades.includes(x.id));
        let upgradesToConsider: Array<IBaseUpgrade | ICraftedUpgrade>;

        if (rank <= formData.originalRank) {
            upgradesToConsider = newUpgrades;
        } else {
            const previousRankUpgradesList = UpgradesService.getCharacterUpgradeRank({
                unitName: character.name,
                rankStart: formData.originalRank,
                rankEnd: rank,
                appliedUpgrades: formData.originalUpgrades,
                rankPoint5: false,
                upgradesRarity: [],
            });

            const previousRankUpgrades = previousRankUpgradesList
                .flatMap(x => x.upgrades)
                .map(x => UpgradesService.getUpgrade(x));
            upgradesToConsider = [...previousRankUpgrades, ...newUpgrades];
        }

        return upgradesToConsider;
    }, [formData.newUpgrades, rank]);

    const { inventoryUpgrades, inventoryUpdate } = useMemo(() => {
        return UpgradesService.updateInventory(cloneDeep(inventory.upgrades), topLevelUpgrades);
    }, [topLevelUpgrades]);

    useEffect(() => {
        if (updateInventory) {
            upgradesChanges(
                formData.currentUpgrades,
                Object.entries(inventoryUpdate).map(([id, count]) => ({ id, count }))
            );
        } else {
            upgradesChanges(formData.currentUpgrades, []);
        }
    }, [formData.currentUpgrades, updateInventory, inventoryUpdate]);

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
                    {StatCalculatorService.getHealth(character)}
                    {healthUpgrades.map((x, index) => (
                        <UpgradeControl
                            key={x.id + index}
                            upgrade={x}
                            checked={formData.currentUpgrades.includes(x.id)}
                            checkedChanges={value => handleUpgradeChange(value, x.id)}
                        />
                    ))}
                </div>
                <div className="upgrades-column">
                    <MiscIcon icon={'damage'} />
                    {StatCalculatorService.getDamage(character)}
                    {damageUpgrades.map((x, index) => (
                        <UpgradeControl
                            key={x.id + index}
                            upgrade={x}
                            checked={formData.currentUpgrades.includes(x.id)}
                            checkedChanges={value => handleUpgradeChange(value, x.id)}
                        />
                    ))}
                </div>
                <div className="upgrades-column">
                    <MiscIcon icon={'armour'} height={30} />
                    {StatCalculatorService.getArmor(character)}
                    {armourUpgrades.map((x, index) => (
                        <UpgradeControl
                            key={x.id + index}
                            upgrade={x}
                            checked={formData.currentUpgrades.includes(x.id)}
                            checkedChanges={value => handleUpgradeChange(value, x.id)}
                        />
                    ))}
                </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
                {unknownUpgrades.map((x, index) => (
                    <UpgradeControl
                        key={x.id + index}
                        upgrade={x}
                        checked={formData.currentUpgrades.includes(x.id)}
                        checkedChanges={value => handleUpgradeChange(value, x.id)}
                    />
                ))}
            </div>
            <hr />
            <FormControlLabel
                control={
                    <Checkbox
                        disabled={!inventoryUpgrades.length}
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
                        {inventoryUpgrades.map((x, index) => (
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
                                {inventory.upgrades[x.id] ?? 0} - {inventoryUpdate[x.id]} ={' '}
                                {(inventory.upgrades[x.id] ?? 0) - inventoryUpdate[x.id] < 0
                                    ? 0
                                    : (inventory.upgrades[x.id] ?? 0) - inventoryUpdate[x.id]}
                            </li>
                        ))}
                    </ul>
                </div>
            </Popover>
        </div>
    );
};
