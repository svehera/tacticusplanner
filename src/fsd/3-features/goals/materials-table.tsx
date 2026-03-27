/* eslint-disable import-x/no-internal-modules */
import {
    AllCommunityModule,
    ColDef,
    ColGroupDef,
    ICellRendererParams,
    CellEditingStoppedEvent,
    themeBalham,
    GridReadyEvent,
} from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';
import React, { useMemo, useRef } from 'react';
import { isMobile } from 'react-device-detect';

import { ICampaignBattleComposed } from 'src/models/interfaces';

import { Rarity, RarityMapper, RarityString } from '@/fsd/5-shared/model';
import { RarityIcon } from '@/fsd/5-shared/ui/icons';
import { UnitShardIcon } from '@/fsd/5-shared/ui/icons/unit-shard.icon';

import { CampaignLocation } from '@/fsd/4-entities/campaign/campaign-location';
import { CharactersService } from '@/fsd/4-entities/character';
import { MowsService } from '@/fsd/4-entities/mow';
import { UpgradeImage } from '@/fsd/4-entities/upgrade/upgrade-image';

import { ICharacterUpgradeEstimate } from '@/fsd/3-features/goals/goals.models';

interface Props {
    rows: ICharacterUpgradeEstimate[];
    updateMaterialQuantity: (materialId: string, quantity: number) => void;
    onGridReady: () => void;
    inventory: Record<string, number>;
    scrollToCharSnowprintId?: string;
    alreadyUsedMaterials?: ICharacterUpgradeEstimate[];
}

interface IRaidMaterialRow extends ICharacterUpgradeEstimate {
    inventoryAfter: number;
    remainingAfter: number;
}

enum MaterialType {
    Shard,
    MythicShard,
    Regular,
}

/**
 * Single source of truth for material identification and formatting
 */
const getMaterialMetadata = (id: string, rarity?: number | string) => {
    const isShard = id.startsWith('shards_');
    const isMythicShard = id.startsWith('mythicShards_');

    let type = MaterialType.Regular;
    if (isShard) type = MaterialType.Shard;
    else if (isMythicShard) type = MaterialType.MythicShard;

    let rarityString: string;
    if (type === MaterialType.Shard) rarityString = 'Shard';
    else if (type === MaterialType.MythicShard) rarityString = 'Mythic Shard';
    else rarityString = typeof rarity === 'number' ? RarityMapper.rarityToRarityString(rarity as Rarity) : 'Unknown';

    return {
        type,
        // Cast this to RarityString to satisfy strict component props
        rarityStr: rarityString as RarityString,
        className: rarityString.toLowerCase().replace(' ', '-'),
    };
};

const MaterialIcon: React.FC<{ data: IRaidMaterialRow; typeOnly?: boolean }> = ({ data, typeOnly }) => {
    const { type, rarityStr } = getMaterialMetadata(data.id, data.rarity);

    if (type === MaterialType.Shard) return <UnitShardIcon icon={data.iconPath} mythic={false} />;
    if (type === MaterialType.MythicShard) return <UnitShardIcon icon={data.iconPath} mythic={true} />;

    if (typeOnly) return <RarityIcon rarity={data.rarity as Rarity} />;

    return <UpgradeImage material={data.label} iconPath={data.iconPath} rarity={rarityStr} />;
};

const getRaritySortKey = (rarity: Rarity | RarityString | 'Shard' | 'Mythic Shard' | undefined): number => {
    const order = ['Shard', 'Common', 'Uncommon', 'Rare', 'Epic', 'Legendary', 'Mythic', 'Mythic Shard', 'Unknown'];
    let normalized = 'Unknown';

    if (typeof rarity === 'number') {
        normalized = RarityMapper.rarityToRarityString(rarity as Rarity);
    } else if (typeof rarity === 'string') {
        normalized = RarityMapper.stringToRarityString(rarity) ?? rarity;
    }

    const index = order.indexOf(normalized);
    return index === -1 ? order.length - 1 : index;
};

export const MaterialsTable: React.FC<Props> = ({
    rows,
    updateMaterialQuantity,
    onGridReady,
    inventory,
    scrollToCharSnowprintId,
    alreadyUsedMaterials,
}) => {
    const columnDefs: Array<ColDef<IRaidMaterialRow> | ColGroupDef<IRaidMaterialRow>> = [
        {
            headerName: 'Upgrade',
            groupId: 'upgrade',
            children: [
                {
                    headerName: '#',
                    colId: 'rowNumber',
                    valueGetter: params => (params.node?.rowIndex ?? 0) + 1,
                    maxWidth: 50,
                },
                {
                    headerName: 'Icon',
                    cellRenderer: (params: ICellRendererParams<IRaidMaterialRow>) =>
                        params.data ? <MaterialIcon data={params.data} /> : null,
                    valueFormatter: () => '',
                    equals: () => true,
                    sortable: false,
                    width: 80,
                },
                {
                    field: 'label',
                    columnGroupShow: 'open',
                    maxWidth: isMobile ? 125 : 300,
                },
                {
                    field: 'rarity',
                    maxWidth: 120,
                    columnGroupShow: 'open',
                    cellStyle: { textAlign: 'center' },
                    cellRenderer: (params: ICellRendererParams<IRaidMaterialRow>) =>
                        params.data ? <MaterialIcon data={params.data} typeOnly /> : null,
                    tooltipValueGetter: params =>
                        params.data ? getMaterialMetadata(params.data.id, params.data.rarity).rarityStr : '',
                    comparator: (valueA, valueB) => getRaritySortKey(valueA) - getRaritySortKey(valueB),
                    cellClass: params =>
                        params.data ? getMaterialMetadata(params.data.id, params.data.rarity).className : 'unknown',
                },
                {
                    columnGroupShow: 'open',
                    field: 'relatedCharacters',
                    tooltipField: 'relatedCharacters',
                    headerName: 'Characters',
                    maxWidth: 120,
                },
            ],
        },
        // ... (rest of the columns remain the same)
        {
            field: 'requiredCount',
            headerName: 'Goal',
            maxWidth: 75,
        },
        {
            valueGetter: params => params.data?.inventoryAfter ?? 0,
            valueSetter: event => {
                updateMaterialQuantity(event.data.snowprintId, event.newValue);
                return true;
            },
            headerName: 'Inventory (after higher-priority goals)',
            editable: true,
            cellDataType: 'number',
            cellEditor: 'agNumberCellEditor',
            cellEditorParams: { min: 0, max: 1000, precision: 0 },
        },
        {
            headerName: 'Remaining',
            maxWidth: 90,
            valueGetter: params => {
                const { data } = params;
                return data ? Math.max(0, data.requiredCount - (data.inventoryAfter ?? 0)) : 0;
            },
        },
        {
            headerName: 'Estimate',
            openByDefault: true,
            children: [
                {
                    field: 'daysTotal',
                    columnGroupShow: 'closed',
                    maxWidth: isMobile ? 125 : 300,
                    cellRenderer: (props: ICellRendererParams<ICharacterUpgradeEstimate>) => {
                        if (!props.data) return null;
                        const { daysTotal, energyTotal, raidsTotal } = props.data;
                        return (
                            <ul className="m-0 ps-5">
                                <li>{daysTotal} - days</li>
                                <li>{energyTotal} - energy</li>
                                <li>{raidsTotal} - raids</li>
                            </ul>
                        );
                    },
                },
                { headerName: 'Days', field: 'daysTotal', columnGroupShow: 'open', maxWidth: 90 },
                { field: 'energyTotal', headerName: 'Energy', columnGroupShow: 'open', maxWidth: 90 },
                { headerName: 'Raids', field: 'raidsTotal', columnGroupShow: 'open', maxWidth: 90 },
            ],
        },
        {
            headerName: 'Locations',
            children: [
                {
                    columnGroupShow: 'closed',
                    valueGetter: params => params.data?.locations.map(x => x.id) ?? [],
                    cellRenderer: (props: ICellRendererParams<ICharacterUpgradeEstimate>) => {
                        const locations: ICampaignBattleComposed[] = props.data?.locations ?? [];
                        const usedLocations = locations.filter(x => x.isSuggested).length;
                        const canBeUsedLocations = locations.filter(x => x.isUnlocked && x.isPassFilter).length;
                        const lockedLocations = locations.filter(x => !x.isUnlocked).length;
                        return (
                            <ul className="m-0 ps-5">
                                <li>
                                    {usedLocations}/{canBeUsedLocations} - used
                                </li>
                                {lockedLocations > 0 && <li className="text-red-500">{lockedLocations} - locked</li>}
                            </ul>
                        );
                    },
                },
                {
                    columnGroupShow: 'open',
                    headerName: 'Used',
                    valueGetter: params => params.data?.locations.filter(x => x.isSuggested).map(x => x.id) ?? [],
                    cellRenderer: (params: ICellRendererParams<ICharacterUpgradeEstimate>) => (
                        <div className="flex-box gap5 wrap">
                            {params.data?.locations
                                .filter(x => x.isSuggested)
                                .map(loc => (
                                    <CampaignLocation key={loc.id} location={loc} short unlocked />
                                ))}
                        </div>
                    ),
                },
                {
                    headerName: 'Locked',
                    columnGroupShow: 'open',
                    valueGetter: params => params.data?.locations.filter(x => !x.isUnlocked).map(x => x.id) ?? [],
                    cellRenderer: (params: ICellRendererParams<ICharacterUpgradeEstimate>) => (
                        <div className="flex-box gap5 wrap">
                            {params.data?.locations
                                .filter(x => !x.isUnlocked)
                                .map(loc => (
                                    <CampaignLocation key={loc.id} location={loc} short unlocked={false} />
                                ))}
                        </div>
                    ),
                },
                {
                    headerName: 'Other',
                    columnGroupShow: 'open',
                    valueGetter: params =>
                        params.data?.locations.filter(x => !x.isSuggested && x.isUnlocked).map(x => x.id) ?? [],
                    cellRenderer: (params: ICellRendererParams<ICharacterUpgradeEstimate>) => (
                        <div className="flex-box gap5 wrap">
                            {params.data?.locations
                                .filter(x => !x.isSuggested && x.isUnlocked)
                                .map(loc => (
                                    <CampaignLocation key={loc.id} location={loc} short unlocked />
                                ))}
                        </div>
                    ),
                },
            ],
        },
    ];

    const saveChanges = (event: CellEditingStoppedEvent<ICharacterUpgradeEstimate>): void => {
        if (event.data && event.newValue !== event.oldValue) {
            updateMaterialQuantity(event.data.snowprintId, event.newValue);
        }
    };

    const processedRows = useMemo(() => {
        const inventoryTracker: Record<string, number> = { ...inventory };
        if (alreadyUsedMaterials) {
            for (const used of alreadyUsedMaterials) {
                if (used.snowprintId) {
                    inventoryTracker[used.snowprintId] = Math.max(
                        0,
                        (inventoryTracker[used.snowprintId] ?? 0) - (used.requiredCount ?? 0)
                    );
                }
            }
        }
        return rows.map(row => {
            const currentInventory = inventoryTracker[row.snowprintId] ?? 0;
            const remaining = Math.max(0, row.requiredCount - currentInventory);
            inventoryTracker[row.snowprintId] = Math.max(0, currentInventory - row.requiredCount);
            return { ...row, inventoryAfter: currentInventory, remainingAfter: remaining };
        }) as IRaidMaterialRow[];
    }, [rows, inventory, alreadyUsedMaterials]);

    const gridApiReference = useRef<GridReadyEvent['api'] | null>(null);

    const scrollToChar = (api: GridReadyEvent['api'], snowprintId: string) => {
        const char = CharactersService.resolveCharacter(snowprintId);
        const name = char?.name ?? MowsService.resolveToStatic(snowprintId)?.name ?? '';
        if (!name) return;
        const targetIndex = processedRows.findIndex(row => row.relatedCharacters?.includes(name));
        if (targetIndex !== -1) {
            api.ensureIndexVisible(targetIndex, 'top');
            api.setColumnGroupOpened('upgrade', true);
        }
    };

    const onGridReadyInternal = (params: GridReadyEvent) => {
        gridApiReference.current = params.api;
        if (scrollToCharSnowprintId) {
            scrollToChar(params.api, scrollToCharSnowprintId);
        }
        onGridReady();
    };

    return (
        <AgGridReact
            modules={[AllCommunityModule]}
            theme={themeBalham}
            onCellEditingStopped={saveChanges}
            suppressChangeDetection
            singleClickEdit
            defaultColDef={{ suppressMovable: true, sortable: true, wrapText: true, autoHeight: true }}
            columnDefs={columnDefs}
            rowData={processedRows}
            onGridReady={onGridReadyInternal}
        />
    );
};
