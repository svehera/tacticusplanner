import React, { useMemo } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ColDef, ColGroupDef, ICellRendererParams, ValueFormatterParams } from 'ag-grid-community';
import { UpgradeImage } from 'src/shared-components/upgrade-image';
import { isMobile } from 'react-device-detect';
import { Rarity } from 'src/models/enums';
import { CellEditingStoppedEvent } from 'ag-grid-community/dist/lib/events';
import InfoIcon from '@mui/icons-material/Info';
import { ICharacterUpgradeEstimate } from 'src/v2/features/goals/goals.models';
import { ICampaignBattleComposed } from 'src/models/interfaces';
import { CampaignLocation } from 'src/shared-components/goals/campaign-location';

interface Props {
    rows: ICharacterUpgradeEstimate[];
    updateMaterialQuantity: (materialId: string, quantity: number) => void;
    onGridReady: () => void;
    inventory: Record<string, number>;
}

export const MaterialsTable: React.FC<Props> = ({ rows, updateMaterialQuantity, onGridReady, inventory }) => {
    const columnDefs = useMemo<
        Array<ColDef<ICharacterUpgradeEstimate> | ColGroupDef<ICharacterUpgradeEstimate>>
    >(() => {
        return [
            {
                headerName: 'Upgrade',
                children: [
                    {
                        headerName: '#',
                        colId: 'rowNumber',
                        valueGetter: params => (params.node?.rowIndex ?? 0) + 1,
                        maxWidth: 50,
                    },
                    {
                        headerName: 'Icon',
                        cellRenderer: (params: ICellRendererParams<ICharacterUpgradeEstimate>) => {
                            const { data } = params;
                            if (data) {
                                return (
                                    <UpgradeImage material={data.label} rarity={data.rarity} iconPath={data.iconPath} />
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
                        valueFormatter: (params: ValueFormatterParams<ICharacterUpgradeEstimate>) =>
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
                    return inventory[params.data!.id] ?? 0;
                },
                valueSetter: event => {
                    inventory[event.data.id] = event.newValue;
                    return true;
                },
                headerName: 'Inventory',
                editable: true,
                cellEditorPopup: false,
                cellDataType: 'number',
                cellEditor: 'agNumberCellEditor',
                cellEditorParams: {
                    min: 0,
                    max: 1000,
                    precision: 0,
                },
                maxWidth: 90,
            },
            {
                headerName: 'Remaining',
                maxWidth: 90,
                valueGetter: params => {
                    const { data } = params;
                    if (data) {
                        const actualAcquired = inventory[params.data!.id] ?? 0;
                        return Math.max(0, data.requiredCount - actualAcquired);
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
                                <ul style={{ margin: 0, paddingInlineStart: 20 }}>
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
                                <ul style={{ margin: 0, paddingInlineStart: 20 }}>
                                    <li>
                                        {usedLocations}/{canBeUsedLocations} - used
                                    </li>
                                    {lockedLocations > 0 && (
                                        <li style={{ color: 'red' }}>{lockedLocations} - locked</li>
                                    )}
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
                            return (
                                params.data?.locations.filter(x => !x.isSuggested && x.isUnlocked).map(x => x.id) ?? []
                            );
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
    }, []);

    const saveChanges = (event: CellEditingStoppedEvent<ICharacterUpgradeEstimate>): void => {
        if (event.data && event.newValue !== event.oldValue) {
            updateMaterialQuantity(event.data.id, event.newValue);
        }
    };
    return (
        <div
            className="ag-theme-material"
            style={{
                height: 50 + rows.length * 30,
                minHeight: 150,
                maxHeight: '40vh',
                width: '100%',
            }}>
            <div className="flex-box gap5">
                <InfoIcon color="primary" />
                <span>
                    Click on the <b>Inventory</b> column cell to edit its value
                </span>
            </div>
            <AgGridReact
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
                rowData={rows}
                onGridReady={onGridReady}
            />
        </div>
    );
};
