import { Badge } from '@mui/material';
import { AllCommunityModule, ColDef, ICellRendererParams, ValueGetterParams, themeBalham } from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';
import { mapValues, sum } from 'lodash';
import React, { useState } from 'react';

import { Rarity } from 'src/models/enums';
import { RarityImage } from 'src/v2/components/images/rarity-image';

import { FlexBox } from '@/fsd/5-shared/ui';

import { IGuildWarOffensePlayer } from 'src/v2/features/guild/guild.models';

import './players-table.css';

export const GuildOffenseTable = ({
    rows,
    onRowClick,
}: {
    rows: IGuildWarOffensePlayer[];
    onRowClick?: (player: IGuildWarOffensePlayer) => void;
}) => {
    const [columnDefs] = useState<Array<ColDef<IGuildWarOffensePlayer>>>([
        {
            headerName: '#',
            colId: 'rowNumber',
            valueGetter: params => (params.node?.rowIndex ?? 0) + 1,
            maxWidth: 50,
            width: 50,
        },
        {
            field: 'username',
            width: 140,
        },
        {
            field: 'tokensLeft',
            width: 140,
            cellRenderer: (params: ICellRendererParams<IGuildWarOffensePlayer>) => {
                const { value } = params;

                return value === -1 ? 'Uknown' : value;
            },
        },
        {
            field: 'charactersLeft',
            width: 140,
        },
        {
            field: 'charactersUnlocked',
            width: 140,
        },
        {
            field: 'rarityPool',
            headerName: 'Rarity pool',
            width: 150,
            valueGetter: (params: ValueGetterParams<IGuildWarOffensePlayer>) => {
                const data = params.data!.rarityPool;

                return sum(Object.values(mapValues(data, (x, y) => x * +y)));
            },
            cellRenderer: (params: ICellRendererParams<IGuildWarOffensePlayer>) => {
                const slots = params.data!.rarityPool;

                return (
                    <FlexBox gap={10} style={{ height: '100%' }}>
                        {[Rarity.Legendary, Rarity.Epic, Rarity.Rare, Rarity.Uncommon].map(rarity => {
                            const slotsCount = slots[rarity];
                            if (slotsCount) {
                                return (
                                    <Badge key={rarity} badgeContent={slotsCount}>
                                        <RarityImage rarity={rarity} />
                                    </Badge>
                                );
                            }
                        })}
                    </FlexBox>
                );
            },
        },
    ]);

    return (
        <div className="ag-theme-material bf-table">
            <AgGridReact
                modules={[AllCommunityModule]}
                theme={themeBalham}
                suppressCellFocus={true}
                columnDefs={columnDefs}
                rowHeight={40}
                rowData={rows}
                onRowClicked={event => onRowClick && onRowClick(event.data!)}></AgGridReact>
        </div>
    );
};
