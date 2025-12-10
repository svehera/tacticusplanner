import { Info } from '@mui/icons-material';
import { Checkbox, FormControlLabel, Popover } from '@mui/material';
import Button from '@mui/material/Button';
import { cloneDeep } from 'lodash';
import React, { useContext, useEffect, useMemo, useState } from 'react';

// eslint-disable-next-line import-x/no-internal-modules
import { StoreContext } from '@/reducers/store.provider';

import { findAndRemoveItem } from '@/fsd/5-shared/lib';
import { Rank, RarityMapper } from '@/fsd/5-shared/model';
import { MiscIcon } from '@/fsd/5-shared/ui/icons';

import { ICharacter2, CharacterUpgradesService } from '@/fsd/4-entities/character';
import { StatsCalculatorService } from '@/fsd/4-entities/unit';
import {
    IBaseUpgrade,
    ICraftedUpgrade,
    IUpgradeRecipe,
    UpgradesService,
    UpgradeControl,
    UpgradeImage,
} from '@/fsd/4-entities/upgrade';

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
        const [rankUpgrades] = CharacterUpgradesService.getCharacterUpgradeRank({
            unitId: character.snowprintId ?? '',
            unitName: character.name,
            rankStart: rank,
            rankEnd: rank + 1,
            appliedUpgrades: [],
            rankStartPoint5: false,
            rankPoint5: false,
            upgradesRarity: [],
        });

        return rankUpgrades.upgrades.map(x => UpgradesService.getUpgrade(x));
    }, [rank]);

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
            currentUpgrades = [...formData.currentUpgrades];
            findAndRemoveItem(currentUpgrades, value);

            newUpgrades = [...formData.newUpgrades];
            findAndRemoveItem(newUpgrades, value);
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
        // We need to be careful not to remove duplicates from the list here, in
        // order to correctly calculate the inventory changes when there are duplicate
        // upgrades for the current rank.
        const newUpgrades = formData.newUpgrades
            .map(x => possibleUpgrades.find(y => y.id === x))
            .filter(x => x !== undefined);

        let upgradesToConsider: Array<IBaseUpgrade | ICraftedUpgrade>;

        if (rank <= formData.originalRank) {
            upgradesToConsider = newUpgrades;
        } else {
            const previousRankUpgradesList = CharacterUpgradesService.getCharacterUpgradeRank({
                unitId: character.snowprintId ?? '',
                unitName: character.name,
                rankStart: formData.originalRank,
                rankEnd: rank,
                appliedUpgrades: formData.originalUpgrades,
                rankPoint5: false,
                rankStartPoint5: false,
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

    // When each upgrade control is being created it needs to know if
    // the upgrade has already been used by a previous control in order to avoid
    // duplicate upgrades causing all controls for that upgrade type to be checked
    //
    // This is done by creating a copy of the current upgrades and removing the
    // item used to check the previous controls.
    const upgradeStack = [...formData.currentUpgrades];

    return (
        <div>
            <div className="flex">
                <div className="flex flex-col items-center justify-center gap-[5px]">
                    <MiscIcon icon={'health'} height={30} />
                    {StatsCalculatorService.getHealth(character)}
                    {healthUpgrades.map((x, index) => (
                        <UpgradeControl
                            key={x.id + index}
                            upgrade={x}
                            checked={findAndRemoveItem(upgradeStack, x.id)}
                            checkedChanges={value => handleUpgradeChange(value, x.id)}
                        />
                    ))}
                </div>
                <div className="flex flex-col items-center justify-center gap-[5px]">
                    <MiscIcon icon={'damage'} />
                    {StatsCalculatorService.getDamage(character)}
                    {damageUpgrades.map((x, index) => (
                        <UpgradeControl
                            key={x.id + index}
                            upgrade={x}
                            checked={findAndRemoveItem(upgradeStack, x.id)}
                            checkedChanges={value => handleUpgradeChange(value, x.id)}
                        />
                    ))}
                </div>
                <div className="flex flex-col items-center justify-center gap-[5px]">
                    <MiscIcon icon={'armour'} height={30} />
                    {StatsCalculatorService.getArmor(character)}
                    {armourUpgrades.map((x, index) => (
                        <UpgradeControl
                            key={x.id + index}
                            upgrade={x}
                            checked={findAndRemoveItem(upgradeStack, x.id)}
                            checkedChanges={value => handleUpgradeChange(value, x.id)}
                        />
                    ))}
                </div>
            </div>
            <div className="flex flex-col">
                {unknownUpgrades.map((x, index) => (
                    <UpgradeControl
                        key={x.id + index}
                        upgrade={x}
                        checked={findAndRemoveItem(upgradeStack, x.id)}
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
                <div className="p-[15px]">
                    <p>Inventory after update:</p>
                    <ul className="p-0">
                        {inventoryUpgrades.map((x, index) => (
                            <li key={x.id + index} className="flex items-center gap-2.5 pb-2.5 list-none">
                                <UpgradeImage
                                    material={x.label}
                                    iconPath={x.iconPath}
                                    rarity={RarityMapper.rarityToRarityString(x.rarity)}
                                />{' '}
                                {inventory.upgrades[x.snowprintId] ?? 0} - {inventoryUpdate[x.snowprintId]} ={' '}
                                {(inventory.upgrades[x.snowprintId] ?? 0) - inventoryUpdate[x.snowprintId] < 0
                                    ? 0
                                    : (inventory.upgrades[x.snowprintId] ?? 0) - inventoryUpdate[x.snowprintId]}
                            </li>
                        ))}
                    </ul>
                </div>
            </Popover>
        </div>
    );
};
