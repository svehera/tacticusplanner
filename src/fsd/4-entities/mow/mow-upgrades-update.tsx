import { Info } from '@mui/icons-material';
import { Checkbox, FormControlLabel, Popover } from '@mui/material';
import Button from '@mui/material/Button';
import React, { useEffect, useMemo } from 'react';

import { Alliance, Rarity, RarityMapper } from '@/fsd/5-shared/model';

import { UpgradesService, UpgradeImage } from '@/fsd/4-entities/upgrade/@x/mow';

import { MowsService } from './mows.service';

interface Properties {
    mowId: string;
    inventory: Record<string, number>;
    currPrimaryLevel: number;
    currSecondaryLevel: number;
    originalPrimaryLevel: number;
    originalSecondaryLevel: number;
    inventoryDecrement: (value: Record<string, number>) => void;
}

export const MowUpgradesUpdate: React.FC<Properties> = ({
    mowId,
    inventory,
    originalSecondaryLevel,
    originalPrimaryLevel,
    currSecondaryLevel,
    currPrimaryLevel,
    inventoryDecrement,
}) => {
    const { inventoryUpgrades, inventoryUpdate } = useMemo(() => {
        const primaryLevels = Array.from(
            { length: Math.max(currPrimaryLevel - originalPrimaryLevel, 0) },
            (_, index) => originalPrimaryLevel + index + 1
        );

        const secondaryLevels = Array.from(
            { length: Math.max(currSecondaryLevel - originalSecondaryLevel, 0) },
            (_, index) => originalSecondaryLevel + index + 1
        );

        const primary =
            primaryLevels.length > 0
                ? MowsService.getMaterialsList(mowId, mowId, Alliance.Imperial, primaryLevels)
                : [];
        const secondary =
            secondaryLevels.length > 0
                ? MowsService.getMaterialsList(mowId, mowId, Alliance.Imperial, secondaryLevels)
                : [];

        const totalUpgrades = [
            ...primary.flatMap(x => x.primaryUpgrades),
            ...secondary.flatMap(x => x.secondaryUpgrades),
        ];
        return UpgradesService.updateInventory(inventory, totalUpgrades);
    }, [currPrimaryLevel, currSecondaryLevel]);

    const [anchorElement, setAnchorElement] = React.useState<HTMLButtonElement | null>(null);
    const [updateInventory, setUpdateInventory] = React.useState<boolean>(true);

    const handleClick = (event: React.UIEvent<HTMLButtonElement>) => {
        setAnchorElement(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorElement(null);
    };

    const open = Boolean(anchorElement);

    useEffect(() => {
        if (updateInventory) {
            inventoryDecrement(inventoryUpdate);
        } else {
            inventoryDecrement({});
        }
    }, [updateInventory, inventoryUpdate]);

    return (
        <div className="flex items-center">
            <FormControlLabel
                control={
                    <Checkbox
                        disabled={inventoryUpgrades.length === 0}
                        checked={updateInventory}
                        onChange={event => {
                            setUpdateInventory(event.target.checked);
                        }}
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
                anchorEl={anchorElement}
                onClose={handleClose}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'left',
                }}>
                <div className="p-[15px]">
                    <p>Inventory after update:</p>
                    <ul className="p-0">
                        {inventoryUpgrades.map((x, index) => (
                            <li key={x.id + index} className="flex list-none items-center gap-2.5 pb-2.5">
                                {x.rarity in Rarity && (
                                    <UpgradeImage
                                        material={x.label}
                                        iconPath={x.iconPath}
                                        rarity={RarityMapper.rarityToRarityString(x.rarity as unknown as Rarity)}
                                    />
                                )}{' '}
                                {inventory[x.id] ?? 0} - {inventoryUpdate[x.id]} ={' '}
                                {Math.max((inventory[x.id] ?? 0) - inventoryUpdate[x.id], 0)}
                            </li>
                        ))}
                    </ul>
                </div>
            </Popover>
        </div>
    );
};
