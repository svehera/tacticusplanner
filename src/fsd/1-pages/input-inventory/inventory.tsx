import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Accordion, AccordionDetails, AccordionSummary } from '@mui/material';
import { groupBy, map, orderBy } from 'lodash';
import React, { useCallback, useContext, useMemo, useState } from 'react';
import { isMobile } from 'react-device-detect';

// eslint-disable-next-line import-x/no-internal-modules
import { DispatchContext, StoreContext } from '@/reducers/store.provider';

import { Rarity } from '@/fsd/5-shared/model';
import { RarityIcon } from '@/fsd/5-shared/ui/icons';

import { UpgradesService } from '@/fsd/4-entities/upgrade';

import { InventoryControls } from './inventory-controls';
import { IInventoryUpgrade, IUpgradesGroup } from './inventory-models';
import { UpgradesGroup } from './upgrades-group';

interface Props {
    itemsFilter?: string[];
    onUpdate?: () => void;
}

export const Inventory: React.FC<Props> = ({ itemsFilter = [], onUpdate }) => {
    const dispatch = useContext(DispatchContext);
    const { inventory, viewPreferences } = useContext(StoreContext);

    const [nameFilter, setNameFilter] = useState<string>('');

    const itemsList = useMemo<IInventoryUpgrade[]>(() => {
        return orderBy(
            Object.values(UpgradesService.recipeDataByName)
                .filter(
                    item => item.stat !== 'Shard' && (!itemsFilter.length || itemsFilter.includes(item.snowprintId))
                )
                .map(x => ({
                    material: x.material,
                    snowprintId: x.snowprintId,
                    label: x.label ?? x.material,
                    rarity: Rarity[x.rarity as unknown as number] as unknown as Rarity,
                    craftable: x.craftable,
                    stat: x.stat,
                    quantity: inventory.upgrades[x.snowprintId] ?? 0,
                    iconPath: x.icon ?? '',
                    faction: x.faction ?? '',
                    visible: true,
                    alphabet: (x.label ?? x.material)[0].toUpperCase(),
                })),
            viewPreferences.inventoryShowAlphabet ? ['rarity', 'label', 'faction'] : ['rarity', 'faction', 'label'],
            ['desc', 'asc', 'asc']
        );
    }, [viewPreferences.inventoryShowAlphabet, inventory.upgrades]);

    const filterItem = useCallback(
        (item: IInventoryUpgrade) =>
            (item.material.toLowerCase().includes(nameFilter.toLowerCase()) ||
                item.label.toLowerCase().includes(nameFilter.toLowerCase())) &&
            (viewPreferences.craftableItemsInInventory || !item.craftable),
        [nameFilter, viewPreferences.craftableItemsInInventory]
    );

    const itemsGrouped = useMemo(() => {
        return map(
            groupBy(itemsList.filter(filterItem), 'rarity'),
            (items, rarity): IUpgradesGroup => ({
                label: Rarity[+rarity],
                rarity: +rarity,
                items: map(
                    groupBy(
                        items.filter(x => !x.craftable).filter(x => x.material.indexOf('Coming soon') === -1),
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
            })
        ).reverse();
    }, [itemsList, filterItem]);

    const update = useCallback((upgradeId: string, value: number) => {
        dispatch.inventory({
            type: 'UpdateUpgradeQuantity',
            upgrade: upgradeId,
            value: value,
        });
        if (onUpdate) {
            onUpdate();
        }
    }, []);

    const resetUpgrades = useCallback((): void => {
        const result = confirm('All items quantity will be set to zero (0)');
        if (result) {
            dispatch.inventory({
                type: 'ResetUpgrades',
            });
            itemsList.forEach(row => {
                row.quantity = 0;
            });
        }
    }, [itemsList]);

    return (
        <>
            <InventoryControls nameFilter={nameFilter} setNameFilter={setNameFilter} resetUpgrades={resetUpgrades} />

            {itemsGrouped.map(group => (
                <Accordion key={group.rarity} defaultExpanded={!isMobile && !viewPreferences.craftableItemsInInventory}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <h2 className="flex gap-1 items-center">
                            <RarityIcon rarity={group.rarity} /> <span>{group.label}</span>
                        </h2>
                    </AccordionSummary>
                    <AccordionDetails>
                        <UpgradesGroup
                            group={group}
                            showAlphabet={viewPreferences.inventoryShowAlphabet}
                            showPlusMinus={viewPreferences.inventoryShowPlusMinus}
                            dataUpdate={update}
                        />
                    </AccordionDetails>
                </Accordion>
            ))}
        </>
    );
};
