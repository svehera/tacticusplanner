import { AllCommunityModule, ColDef, ICellRendererParams, themeBalham } from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';
import React, { useState } from 'react';

import { Rarity, RarityMapper } from '@/fsd/5-shared/model';
import { RarityIcon } from '@/fsd/5-shared/ui/icons';

import { CampaignLocation } from '@/fsd/4-entities/campaign';
import { UpgradeImage } from '@/fsd/4-entities/upgrade';

import { IMowUpgrade } from './lookup.models';

interface Props {
    rows: IMowUpgrade[];
    upgrades: Record<string, number>;
}

export const MowUpgradesTable: React.FC<Props> = ({ rows, upgrades }) => {
    const [columnDefs] = useState<Array<ColDef<IMowUpgrade>>>([
        {
            headerName: '#',
            colId: 'rowNumber',
            valueGetter: params => (params.node?.rowIndex ?? 0) + 1,
            maxWidth: 50,
        },
        {
            headerName: 'Upgrade',
            valueGetter: params => {
                return params.data?.id ?? '';
            },
            cellRenderer: (params: ICellRendererParams<IMowUpgrade>) => {
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
            sortable: false,
            width: 80,
        },
        {
            field: 'requiredTotal',
            headerName: 'Count',
            maxWidth: 75,
        },
        {
            valueGetter: params => {
                return upgrades[params.data!.id] ?? 0;
            },
            headerName: 'Inventory',
            maxWidth: 90,
        },
        {
            valueGetter: params => {
                return params.data ? Math.max(params.data.requiredTotal - upgrades[params.data.id], 0) : 0;
            },
            headerName: 'Remaining',
            maxWidth: 90,
        },
        {
            field: 'rarity',
            maxWidth: 70,
            cellRenderer: (params: ICellRendererParams<IMowUpgrade>) => {
                const { data } = params;
                if (data) {
                    return <RarityIcon rarity={data.rarity} />;
                }
            },
            cellClass: params => Rarity[params.data?.rarity ?? 0].toLowerCase(),
        },
        {
            headerName: 'Locations',
            minWidth: 300,
            flex: 1,
            cellRenderer: (params: ICellRendererParams<IMowUpgrade>) => {
                const { data } = params;
                if (data) {
                    return (
                        <div className="flex-box gap5 wrap">
                            {data.locations.map(location => (
                                <CampaignLocation key={location.id} location={location} short={true} unlocked={true} />
                            ))}
                        </div>
                    );
                }
            },
        },
    ]);

    return (
        <>
            <div
                className="ag-theme-material"
                style={{ height: 50 + rows.length * 60, maxHeight: '50vh', width: '100%' }}>
                <AgGridReact
                    modules={[AllCommunityModule]}
                    theme={themeBalham}
                    suppressCellFocus={true}
                    defaultColDef={{ suppressMovable: true, sortable: true, wrapText: true, autoHeight: true }}
                    rowHeight={60}
                    rowBuffer={3}
                    columnDefs={columnDefs}
                    rowData={rows}
                />
            </div>
        </>
    );
};
