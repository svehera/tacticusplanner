import React, { useMemo } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { IMaterialEstimated2 } from 'src/models/interfaces';
import { ColDef, ICellRendererParams, ValueFormatterParams } from 'ag-grid-community';
import { UpgradeImage } from 'src/shared-components/upgrade-image';
import { isMobile } from 'react-device-detect';
import { Rarity } from 'src/models/enums';
import { CellEditingStoppedEvent } from 'ag-grid-community/dist/lib/events';

interface Props {
    rows: IMaterialEstimated2[];
    updateMaterialQuantity: (materialId: string, quantity: number) => void;
    onGridReady: () => void;
}

export const MaterialsTable: React.FC<Props> = ({ rows, updateMaterialQuantity, onGridReady }) => {
    const columnDefs = useMemo<Array<ColDef<IMaterialEstimated2>>>(() => {
        return [
            {
                headerName: '#',
                colId: 'rowNumber',
                valueGetter: params => (params.node?.rowIndex ?? 0) + 1,
                maxWidth: 50,
            },
            {
                headerName: 'Icon',
                cellRenderer: (params: ICellRendererParams<IMaterialEstimated2>) => {
                    const { data } = params;
                    if (data) {
                        return <UpgradeImage material={data.label} rarity={data.rarity} iconPath={data.iconPath} />;
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
                headerName: 'Upgrade',
                maxWidth: isMobile ? 125 : 300,
            },
            {
                field: 'quantity',
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
                field: 'countLeft',
                headerName: 'Left',
                maxWidth: 90,
                cellStyle: cellClassParams => {
                    const { data } = cellClassParams;
                    if (data) {
                        return {
                            backgroundColor: data.quantity >= data.count ? 'lightgreen' : 'white',
                        };
                    }
                },
            },
            {
                field: 'count',
                maxWidth: 75,
            },
            {
                field: 'craftedCount',
                headerName: 'Crafted',
                maxWidth: 75,
            },
            {
                field: 'rarity',
                maxWidth: 120,
                valueFormatter: (params: ValueFormatterParams<IMaterialEstimated2>) => Rarity[params.data?.rarity ?? 0],
                cellClass: params => Rarity[params.data?.rarity ?? 0].toLowerCase(),
            },
            {
                field: 'characters',
                tooltipField: 'characters',
                maxWidth: 120,
            },
            {
                field: 'expectedEnergy',
                headerName: 'Energy',
                maxWidth: 90,
            },
            {
                headerName: 'Battles',
                field: 'numberOfBattles',
                maxWidth: 90,
            },
            {
                headerName: 'Days',
                field: 'daysOfBattles',
                maxWidth: 90,
            },
            {
                headerName: 'Locations',
                field: 'locationsString',
                minWidth: 300,
                flex: 1,
            },
            {
                headerName: 'Locked Locations',
                field: 'missingLocationsString',
                minWidth: 300,
                flex: 1,
                cellStyle: () => ({
                    color: 'red',
                }),
            },
        ];
    }, []);

    const saveChanges = (event: CellEditingStoppedEvent<IMaterialEstimated2>): void => {
        if (event.data && event.newValue !== event.oldValue) {
            updateMaterialQuantity(event.data.id, event.data.quantity);
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
            <AgGridReact
                onCellEditingStopped={saveChanges}
                suppressChangeDetection={true}
                singleClickEdit={true}
                defaultColDef={{
                    suppressMovable: true,
                    sortable: true,
                    wrapText: true,
                }}
                rowHeight={60}
                rowBuffer={3}
                columnDefs={columnDefs}
                rowData={rows}
                onGridReady={onGridReady}
            />
        </div>
    );
};
