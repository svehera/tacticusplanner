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
import { ITableRow } from './inventory-models';
import { InventoryItem } from 'src/routes/inventory-item';

interface Props {
    itemsFilter?: string[];
    onUpdate?: () => void;
}

export const Inventory: React.FC<Props> = ({ itemsFilter = [], onUpdate }) => {
    const dispatch = useContext(DispatchContext);
    const { inventory, viewPreferences } = useContext(StoreContext);

    const [nameFilter, setNameFilter] = useState<string>('');
    const [nameFilterRaw, setNameFilterRaw] = useState<string>('');

    const itemsList = useMemo<ITableRow[]>(() => {
        return orderBy(
            Object.values(StaticDataService.recipeData)
                .filter(item => item.stat !== 'Shard' && (!itemsFilter.length || itemsFilter.includes(item.material)))
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

    const update = (upgradeId: string, value: number) => {
        dispatch.inventory({
            type: 'UpdateUpgradeQuantity',
            upgrade: upgradeId,
            value: value,
        });
        if (onUpdate) {
            onUpdate();
        }
    };

    const resetUpgrades = (): void => {
        const result = confirm('All items quantity will be set to zero (0)');
        if (result) {
            dispatch.inventory({
                type: 'ResetUpgrades',
            });
            itemsList.forEach(row => {
                row.quantity = 0;
            });
        }
    };

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
                            {viewPreferences.inventoryShowAlphabet &&
                                group.items.map(group => (
                                    <div key={group.letter} className="inventory-items-alphabet">
                                        <div className="letter">{group.letter}</div>
                                        {group.subItems.map(item => (
                                            <InventoryItem
                                                key={item.material}
                                                data={item}
                                                showIncDec={viewPreferences.inventoryShowPlusMinus}
                                                dataUpdate={update}
                                            />
                                        ))}
                                    </div>
                                ))}

                            {!viewPreferences.inventoryShowAlphabet &&
                                group.itemsAll.map(item => (
                                    <InventoryItem
                                        key={item.material}
                                        data={item}
                                        showIncDec={viewPreferences.inventoryShowPlusMinus}
                                        dataUpdate={update}
                                    />
                                ))}
                        </article>
                    </section>
                ))
                .reverse()}
        </>
    );
};
