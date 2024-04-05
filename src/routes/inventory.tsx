import React, { useCallback, useContext, useMemo, useState } from 'react';

import { FormControl, Input, InputAdornment } from '@mui/material';
import { StaticDataService } from '../services';
import { Rarity } from '../models/enums';
import { DispatchContext, StoreContext } from '../reducers/store.provider';
import { groupBy, map, orderBy } from 'lodash';
import { UpgradeImage } from '../shared-components/upgrade-image';
import Button from '@mui/material/Button';
import ViewSettings from './legendary-events/view-settings';
import { RarityImage } from '../shared-components/rarity-image';
import OutlinedInput from '@mui/material/OutlinedInput';
import InputLabel from '@mui/material/InputLabel';
import IconButton from '@mui/material/IconButton';
import ClearIcon from '@mui/icons-material/Clear';

import './inventory.scss';
import { Conditional } from 'src/v2/components/conditional';

interface ITableRow {
    material: string;
    label: string;
    rarity: Rarity;
    craftable: boolean;
    stat: string | 'Health' | 'Damage' | 'Armour' | 'Shard';
    quantity: number;
    iconPath: string;
    faction: string;
    alphabet: string;
}

export const Inventory = () => {
    const dispatch = useContext(DispatchContext);
    const { inventory, viewPreferences } = useContext(StoreContext);

    const [nameFilter, setNameFilter] = useState<string>('');
    const [nameFilterRaw, setNameFilterRaw] = useState<string>('');

    const itemsList = useMemo<ITableRow[]>(() => {
        return orderBy(
            Object.values(StaticDataService.recipeData)
                .filter(item => item.stat !== 'Shard')
                .map(x => ({
                    material: x.material,
                    label: x.label ?? x.material,
                    rarity: Rarity[x.rarity as unknown as number] as unknown as Rarity,
                    craftable: x.craftable,
                    stat: x.stat,
                    quantity: inventory.upgrades[x.material] ?? 0,
                    iconPath: x.icon ?? '',
                    faction: x.faction ?? '',
                    visible: true,
                    alphabet: (x.label ?? x.material)[0].toUpperCase(),
                })),
            viewPreferences.inventoryShowAlphabet
                ? ['rarity', 'material', 'faction']
                : ['rarity', 'faction', 'material'],
            ['desc', 'asc', 'asc']
        );
    }, [viewPreferences.inventoryShowAlphabet]);

    const filterItem = useCallback(
        (item: ITableRow) =>
            (item.material.toLowerCase().includes(nameFilter.toLowerCase()) ||
                item.label.toLowerCase().includes(nameFilter.toLowerCase())) &&
            (viewPreferences.craftableItemsInInventory || !item.craftable),
        [nameFilter, viewPreferences.craftableItemsInInventory]
    );

    const itemsGrouped = useMemo(() => {
        return map(groupBy(itemsList.filter(filterItem), 'rarity'), (items, rarity) => ({
            label: Rarity[+rarity],
            rarity: +rarity,
            items: map(groupBy(items, 'alphabet'), (subItems, letter) => ({
                letter,
                subItems,
            })),
            itemsAll: items,
        }));
    }, [itemsList, filterItem]);

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, data: ITableRow) => {
        const value = event.target.value === '' ? 0 : Number(event.target.value);
        data.quantity = value > 1000 ? 1000 : value;
        dispatch.inventory({
            type: 'UpdateUpgradeQuantity',
            upgrade: data.material,
            value: data.quantity,
        });
    };

    const resetUpgrades = (): void => {
        const result = confirm('All item quantity will be set to zero (0)');
        if (result) {
            dispatch.inventory({
                type: 'ResetUpgrades',
            });
            itemsList.forEach(row => {
                row.quantity = 0;
            });
        }
    };

    const renderRow = (data: ITableRow) => (
        <div key={data.material} className="inventory-item">
            <UpgradeImage material={data.label} rarity={data.rarity} iconPath={data.iconPath} />
            <Input
                style={{ justifyContent: 'center' }}
                value={data.quantity}
                size="small"
                onFocus={event => event.target.select()}
                onChange={event => handleInputChange(event, data)}
                inputProps={{
                    step: 1,
                    min: 0,
                    max: 1000,
                    type: 'number',
                    style: { width: data.quantity.toString().length * 10 },
                    className: 'item-quantity-input',
                }}
            />
        </div>
    );

    return (
        <>
            <div className="inventory-controls">
                <FormControl sx={{ m: 1, width: '25ch' }} variant="outlined">
                    <InputLabel htmlFor="queick-filter-input">Quick Filter</InputLabel>
                    <OutlinedInput
                        id="queick-filter-input"
                        value={nameFilterRaw}
                        onFocus={event => event.target.select()}
                        onChange={change => {
                            const value = change.target.value;
                            setNameFilterRaw(value);
                            setTimeout(() => setNameFilter(value), value ? 50 : 0);
                        }}
                        endAdornment={
                            nameFilter ? (
                                <InputAdornment position="end">
                                    <IconButton
                                        onClick={() => {
                                            setNameFilterRaw('');
                                            setTimeout(() => setNameFilter(''), 0);
                                        }}
                                        edge="end">
                                        <ClearIcon />
                                    </IconButton>
                                </InputAdornment>
                            ) : null
                        }
                        label="Quick Filter"
                    />
                </FormControl>
                <Button onClick={() => resetUpgrades()} color="error" variant="contained">
                    Reset All
                </Button>
                <ViewSettings preset={'inventory'} />
            </div>

            {itemsGrouped
                .map(group => (
                    <section key={group.rarity} className="inventory-items-group">
                        <h2>
                            <RarityImage rarity={group.rarity} /> {group.label}
                        </h2>
                        <article className="inventory-items">
                            <Conditional condition={viewPreferences.inventoryShowAlphabet}>
                                {group.items.map(group => (
                                    <div key={group.letter} className="inventory-items-alphabet">
                                        <div className="letter">{group.letter}</div>
                                        {group.subItems.map(renderRow)}
                                    </div>
                                ))}
                            </Conditional>

                            <Conditional condition={!viewPreferences.inventoryShowAlphabet}>
                                {group.itemsAll.map(renderRow)}
                            </Conditional>
                        </article>
                    </section>
                ))
                .reverse()}
        </>
    );
};
