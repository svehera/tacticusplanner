import React, { useCallback, useContext, useMemo, useState } from 'react';

import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    FormControl,
    Input,
    InputAdornment,
    TextField,
} from '@mui/material';
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
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { LeProgressOverviewMissions } from 'src/shared-components/le-progress-overview-missions';
import { isMobile } from 'react-device-detect';

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
            items: map(
                groupBy(
                    items.filter(x => !x.craftable),
                    'alphabet'
                ),
                (subItems, letter) => ({
                    letter,
                    subItems,
                })
            ),
            itemsCrafted: map(
                groupBy(
                    items.filter(x => x.craftable),
                    'alphabet'
                ),
                (subItems, letter) => ({
                    letter,
                    subItems,
                })
            ),
            itemsAll: items.filter(x => !x.craftable),
            itemsAllCrafted: items.filter(x => x.craftable),
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
                    <Accordion
                        key={group.rarity}
                        TransitionProps={{ unmountOnExit: true }}
                        defaultExpanded={!isMobile && !viewPreferences.craftableItemsInInventory}>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <h4 className="flex-box gap5">
                                <RarityImage rarity={group.rarity} /> <span>{group.label}</span>
                            </h4>
                        </AccordionSummary>
                        <AccordionDetails>
                            <section className="inventory-items-group">
                                <article>
                                    {viewPreferences.inventoryShowAlphabet && (
                                        <div className="flex-box gap20">
                                            <div className="inventory-items">
                                                {group.itemsAllCrafted.length > 0 && <h3>Basic</h3>}
                                                {group.items.map(group => (
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
                                            </div>
                                            {group.itemsAllCrafted.length > 0 && (
                                                <div className="inventory-items">
                                                    <h3>Crafted</h3>
                                                    {group.itemsCrafted.map(group => (
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
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {!viewPreferences.inventoryShowAlphabet && (
                                        <div className="flex-box gap20">
                                            <div className="inventory-items">
                                                {group.itemsAllCrafted.length > 0 && <h3>Basic</h3>}
                                                {group.itemsAll.map(item => (
                                                    <InventoryItem
                                                        key={item.material}
                                                        data={item}
                                                        showIncDec={viewPreferences.inventoryShowPlusMinus}
                                                        dataUpdate={update}
                                                    />
                                                ))}
                                            </div>
                                            {group.itemsAllCrafted.length > 0 && (
                                                <div className="inventory-items">
                                                    <h3>Crafted</h3>
                                                    {group.itemsAllCrafted.map(item => (
                                                        <InventoryItem
                                                            key={item.material}
                                                            data={item}
                                                            showIncDec={viewPreferences.inventoryShowPlusMinus}
                                                            dataUpdate={update}
                                                        />
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </article>
                            </section>
                        </AccordionDetails>
                    </Accordion>
                ))
                .reverse()}
        </>
    );
};
