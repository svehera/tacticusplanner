import { Badge } from '@mui/material';
import { AllCommunityModule, ColDef, ICellRendererParams, ValueGetterParams, themeBalham } from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';
import { mapValues, sum } from 'lodash';
import React, { useState } from 'react';

import { Difficulty, Rarity } from 'src/models/enums';
import { FlexBox } from 'src/v2/components/flex-box';
import { RarityImage } from 'src/v2/components/images/rarity-image';
import { IGuildWarPlayer } from 'src/v2/features/guild/guild.models';
import { GuildWarService } from 'src/v2/features/guild-war/guild-war.service';

import './players-table.css';

export const PlayersTable = ({
    rows,
    onRowClick,
}: {
    rows: IGuildWarPlayer[];
    onRowClick?: (player: IGuildWarPlayer) => void;
}) => {
    const [columnDefs] = useState<Array<ColDef<IGuildWarPlayer>>>([
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
            field: 'enlistedZone',
            width: 140,
            valueGetter: (params: ValueGetterParams<IGuildWarPlayer>) => {
                const data = params.data?.enlistedZone ?? '';
                const zone = GuildWarService.getZone(data);

                return zone?.name ?? '';
            },
        },
        {
            field: 'unlocked',
            width: 90,
        },
        {
            field: 'slots',
            headerName: 'Rarity pool',
            width: 150,
            valueGetter: (params: ValueGetterParams<IGuildWarPlayer>) => {
                const data = params.data!.slots;

                return sum(Object.values(mapValues(data, (x, y) => x * +y)));
            },
            cellRenderer: (params: ICellRendererParams<IGuildWarPlayer>) => {
                const slots = params.data!.slots;

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
        ...[Difficulty.Easy, Difficulty.Normal, Difficulty.Hard, Difficulty.VeryHard].map(difficulty => ({
            headerName: GuildWarService.gwData.difficulties[difficulty - 1],
            width: 90,
            valueGetter: (params: ValueGetterParams<IGuildWarPlayer>) => {
                const { potential } = params.data ?? {};

                return potential && potential[difficulty];
            },
        })),
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
