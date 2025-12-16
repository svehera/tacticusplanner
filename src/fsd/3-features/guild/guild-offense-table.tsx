import { Badge } from '@mui/material';
import { AllCommunityModule, ColDef, ICellRendererParams, ValueGetterParams, themeBalham } from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';
import { mapValues, sum } from 'lodash';
import { useState } from 'react';

import { Rarity } from '@/fsd/5-shared/model';
import { FlexBox } from '@/fsd/5-shared/ui';
// eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { RarityIcon } from '@/fsd/5-shared/ui/icons/rarity.icon';

// eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { IGuildWarOffensePlayer } from '@/fsd/3-features/guild/guild.models';

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
                    <FlexBox gap={10} className="h-full">
                        {[Rarity.Legendary, Rarity.Epic, Rarity.Rare, Rarity.Uncommon].map(rarity => {
                            const slotsCount = slots[rarity];
                            if (slotsCount) {
                                return (
                                    <Badge key={rarity} badgeContent={slotsCount}>
                                        <RarityIcon rarity={rarity} />
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
        <div className="ag-theme-material w-full h-[350px] [&_.ag-header-cell-label]:justify-center">
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
