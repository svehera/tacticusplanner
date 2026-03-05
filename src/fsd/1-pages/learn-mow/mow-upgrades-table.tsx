import { AllCommunityModule, ColDef, ICellRendererParams, themeBalham } from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';
import React, { useState } from 'react';

import { Rarity, RarityMapper } from '@/fsd/5-shared/model';
import { RarityIcon } from '@/fsd/5-shared/ui/icons';

import { CampaignLocation } from '@/fsd/4-entities/campaign';
import { UpgradeImage } from '@/fsd/4-entities/upgrade';

import { IMowUpgrade } from './lookup.models';

interface Properties {
    rows: IMowUpgrade[];
}

export const MowUpgradesTable: React.FC<Properties> = ({ rows }) => {
    const [columnDefs] = useState<Array<ColDef<IMowUpgrade>>>([
        {
            headerName: '#',
            colId: 'rowNumber',
            valueGetter: parameters => (parameters.node?.rowIndex ?? 0) + 1,
            maxWidth: 50,
        },
        {
            headerName: 'Upgrade',
            valueGetter: parameters => {
                return parameters.data?.id ?? '';
            },
            cellRenderer: (parameters: ICellRendererParams<IMowUpgrade>) => {
                const { data } = parameters;
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
            field: 'rarity',
            maxWidth: 70,
            cellRenderer: (parameters: ICellRendererParams<IMowUpgrade>) => {
                const { data } = parameters;
                if (data) {
                    return <RarityIcon rarity={data.rarity} />;
                }
            },
            cellClass: parameters => Rarity[parameters.data?.rarity ?? 0].toLowerCase(),
        },
        {
            headerName: 'Locations',
            minWidth: 300,
            flex: 1,
            cellRenderer: (parameters: ICellRendererParams<IMowUpgrade>) => {
                const { data } = parameters;
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
            <div className="ag-theme-material max-h-[50vh] w-full" style={{ height: 50 + rows.length * 60 }}>
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
