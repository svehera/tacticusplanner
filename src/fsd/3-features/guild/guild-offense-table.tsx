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
            valueGetter: parameters => (parameters.node?.rowIndex ?? 0) + 1,
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
            cellRenderer: (parameters: ICellRendererParams<IGuildWarOffensePlayer>) => {
                const { value } = parameters;

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
            valueGetter: (parameters: ValueGetterParams<IGuildWarOffensePlayer>) => {
                const data = parameters.data!.rarityPool;

                return sum(Object.values(mapValues(data, (x, y) => x * +y)));
            },
            cellRenderer: (parameters: ICellRendererParams<IGuildWarOffensePlayer>) => {
                const slots = parameters.data!.rarityPool;

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
        <div className="ag-theme-material h-[350px] w-full [&_.ag-header-cell-label]:justify-center">
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
