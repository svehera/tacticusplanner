import InfoIcon from '@mui/icons-material/Info';
import {
    AllCommunityModule,
    ColDef,
    ColGroupDef,
    ICellRendererParams,
    ValueFormatterParams,
    CellEditingStoppedEvent,
    themeBalham,
    GridReadyEvent,
} from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';
import React, { useMemo } from 'react';
import { isMobile } from 'react-device-detect';

import { ICampaignBattleComposed } from 'src/models/interfaces';

import { Rarity, RarityMapper } from '@/fsd/5-shared/model';

import { CampaignLocation } from '@/fsd/4-entities/campaign/campaign-location';
import { CharactersService } from '@/fsd/4-entities/character';
import { MowsService } from '@/fsd/4-entities/mow';
import { UpgradeImage } from '@/fsd/4-entities/upgrade/upgrade-image';

import { ICharacterUpgradeEstimate } from 'src/v2/features/goals/goals.models';

interface Props {
    rows: ICharacterUpgradeEstimate[];
    updateMaterialQuantity: (materialId: string, quantity: number) => void;
    onGridReady: () => void;
    inventory: Record<string, number>;
    /**
     * If set, tells the grid to scroll to the first material used by this character. If the
     * character does not need any materials, does not scroll the grid.
     */
    scrollToCharSnowprintId?: string;
    alreadyUsedMaterials?: ICharacterUpgradeEstimate[];
}

interface IRaidMaterialRow extends ICharacterUpgradeEstimate {
    inventoryAfter: number;
    remainingAfter: number;
}

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
                    cellRenderer: (params: ICellRendererParams<IRaidMaterialRow>) => {
                        const { data } = params;
                        if (data) {
                            return (
                                <UpgradeImage
                                    material={data.label}
                                    iconPath={data.iconPath}
                                    rarity={RarityMapper.rarityToRarityString(data.rarity)}
                                />
                            );
                        }
                    },
                    valueFormatter: () => {
                        return '';
                    },
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
                    valueFormatter: (params: ValueFormatterParams<IRaidMaterialRow>) =>
                        Rarity[params.data?.rarity ?? 0],
                    cellClass: params => Rarity[params.data?.rarity ?? 0].toLowerCase(),
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
        {
            field: 'requiredCount',
            headerName: 'Goal',
            maxWidth: 75,
        },
        {
            valueGetter: params => {
                return params.data?.inventoryAfter ?? 0;
            },
            valueSetter: event => {
                updateMaterialQuantity(event.data.snowprintId, event.newValue);
                return true;
            },
            headerName: 'Inventory (after higher-priority goals)',
            editable: true,
            cellEditorPopup: false,
            cellDataType: 'number',
            cellEditor: 'agNumberCellEditor',
            cellEditorParams: {
                min: 0,
                max: 1000,
                precision: 0,
            },
        },
        {
            headerName: 'Remaining',
            maxWidth: 90,
            valueGetter: params => {
                const { data } = params;
                if (data) {
                    return Math.max(0, data.requiredCount - (data.inventoryAfter ?? 0));
                }
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
                        const { daysTotal, energyTotal, raidsTotal } = props.data!;
                        return (
                            <ul className="m-0 ps-5">
                                <li>{daysTotal} - days</li>
                                <li>{energyTotal} - energy</li>
                                <li>{raidsTotal} - raids</li>
                            </ul>
                        );
                    },
                },
                {
                    headerName: 'Days',
                    field: 'daysTotal',
                    columnGroupShow: 'open',
                    maxWidth: 90,
                },
                {
                    field: 'energyTotal',
                    headerName: 'Energy',
                    columnGroupShow: 'open',
                    maxWidth: 90,
                },
                {
                    headerName: 'Raids',
                    field: 'raidsTotal',
                    columnGroupShow: 'open',
                    maxWidth: 90,
                },
            ],
        },
        {
            headerName: 'Locations',
            children: [
                {
                    columnGroupShow: 'closed',
                    valueGetter: params => {
                        return params.data?.locations.map(x => x.id) ?? [];
                    },
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
                    valueGetter: params => {
                        return params.data?.locations.filter(x => x.isSuggested).map(x => x.id) ?? [];
                    },
                    cellRenderer: (params: ICellRendererParams<ICharacterUpgradeEstimate>) => {
                        const { data } = params;
                        if (data) {
                            return (
                                <div className="flex-box gap5 wrap">
                                    {data.locations
                                        .filter(x => x.isSuggested)
                                        .map(location => (
                                            <CampaignLocation
                                                key={location.id}
                                                location={location}
                                                short={true}
                                                unlocked={true}
                                            />
                                        ))}
                                </div>
                            );
                        }
                    },
                },
                {
                    headerName: 'Locked',
                    columnGroupShow: 'open',
                    valueGetter: params => {
                        return params.data?.locations.filter(x => !x.isUnlocked).map(x => x.id) ?? [];
                    },
                    cellRenderer: (params: ICellRendererParams<ICharacterUpgradeEstimate>) => {
                        const { data } = params;
                        if (data) {
                            return (
                                <div className="flex-box gap5 wrap">
                                    {data.locations
                                        .filter(x => !x.isUnlocked)
                                        .map(location => (
                                            <CampaignLocation
                                                key={location.id}
                                                location={location}
                                                short={true}
                                                unlocked={false}
                                            />
                                        ))}
                                </div>
                            );
                        }
                    },
                },
                {
                    headerName: 'Other',
                    columnGroupShow: 'open',
                    valueGetter: params => {
                        return params.data?.locations.filter(x => !x.isSuggested && x.isUnlocked).map(x => x.id) ?? [];
                    },
                    cellRenderer: (params: ICellRendererParams<ICharacterUpgradeEstimate>) => {
                        const { data } = params;
                        if (data) {
                            return (
                                <div className="flex-box gap5 wrap">
                                    {data.locations
                                        .filter(x => !x.isSuggested && x.isUnlocked)
                                        .map(location => (
                                            <CampaignLocation
                                                key={location.id}
                                                location={location}
                                                short={true}
                                                unlocked={true}
                                            />
                                        ))}
                                </div>
                            );
                        }
                    },
                },
            ],
        },
    ];

    const saveChanges = (event: CellEditingStoppedEvent<ICharacterUpgradeEstimate>): void => {
        if (event.data && event.newValue !== event.oldValue) {
            updateMaterialQuantity(event.data.snowprintId, event.newValue);
        }
    };
    // Compute rolling inventory consumption by higher-priority goals
    const processedRows = useMemo(() => {
        // Map from material snowprintId to running inventory count
        const inventoryTracker: Record<string, number> = { ...inventory };
        // Remove any inventory consumed by already-completed, but not applied, goals (e.g. you got
        // an LRE homey prefarmed to D3 but haven't unlocked the unit yet).
        if (alreadyUsedMaterials) {
            for (const used of alreadyUsedMaterials) {
                if (used.snowprintId && typeof used.requiredCount === 'number') {
                    inventoryTracker[used.snowprintId] = Math.max(
                        0,
                        (inventoryTracker[used.snowprintId] ?? 0) - used.requiredCount
                    );
                }
            }
        }
        // Array to hold processed rows with adjusted inventory and remaining inventory.
        return rows.map(row => {
            const currentInventory = inventoryTracker[row.snowprintId] ?? 0;
            const remaining = Math.max(0, row.requiredCount - currentInventory);
            // Update inventory tracker for next rows (simulate consumption)
            inventoryTracker[row.snowprintId] = Math.max(0, currentInventory - row.requiredCount);
            return {
                ...row,
                inventoryAfter: currentInventory,
                remainingAfter: remaining,
            };
        }) as IRaidMaterialRow[];
    }, [rows, inventory, alreadyUsedMaterials]);

    const onGridReadyInternal = (params: GridReadyEvent) => {
        if (!params.api) return;
        if (scrollToCharSnowprintId === undefined) return;
        let name: string = CharactersService.resolveCharacter(scrollToCharSnowprintId)?.name ?? '';
        if (name.length === 0) {
            const mow = MowsService.resolveToStatic(scrollToCharSnowprintId);
            name = mow?.name ?? '';
        }
        if (name.length === 0) {
            console.error('Character or MOW not found for snowprintId:', scrollToCharSnowprintId);
            onGridReady();
            return;
        }
        // Find the first row that uses this character as a material
        const targetIndex = processedRows.findIndex(row => row.relatedCharacters?.includes(name));
        if (targetIndex !== -1) {
            const rowNode = params.api.getDisplayedRowAtIndex(targetIndex);
            if (rowNode) {
                params.api.ensureIndexVisible(rowNode.rowIndex ?? 0, 'top');
                params.api.setColumnGroupOpened('upgrade', true);
            }
        }
        onGridReady();
    };

    return (
        <div className="ag-theme-material w-full max-h-[40vh] min-h-[150px]" style={{ height: 50 + rows.length * 30 }}>
            <div className="flex-box gap5">
                <InfoIcon color="primary" />
                <span>
                    Click on the <b>Inventory</b> column cell to edit its value
                </span>
            </div>
            <AgGridReact
                modules={[AllCommunityModule]}
                theme={themeBalham}
                onCellEditingStopped={saveChanges}
                suppressChangeDetection={true}
                singleClickEdit={true}
                defaultColDef={{
                    suppressMovable: true,
                    sortable: true,
                    wrapText: true,
                    autoHeight: true,
                }}
                columnDefs={columnDefs}
                rowData={processedRows}
                onGridReady={onGridReadyInternal}
            />
        </div>
    );
};
