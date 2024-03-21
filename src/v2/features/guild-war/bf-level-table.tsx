import React, { useState } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ColDef, ICellRendererParams } from 'ag-grid-community';
import { IGWSection } from './guild-war.models';

import './bf-level-table.css';
import { GuildWarService } from 'src/v2/features/guild-war/guild-war.service';
import { RarityImage } from 'src/v2/components/images/rarity-image';
import { FlexBox } from 'src/v2/components/flex-box';
import { ValueGetterParams } from 'ag-grid-community/dist/lib/entities/colDef';
import { sum } from 'lodash';
export const BfLevelTable = ({ rows }: { rows: IGWSection[] }) => {
    const bfLevels = Object.keys(rows[0].rarityCaps);
    const [columnDefs] = useState<Array<ColDef>>([
        {
            field: 'name',
            headerName: 'Section',
            width: 140,
        },
        {
            field: 'warScore',
            headerName: 'Score',
            width: 140,
        },
        ...bfLevels.map(level => ({
            headerName: level,
            width: 150,
            valueGetter: (params: ValueGetterParams<IGWSection>) => {
                const data = params.data!;

                const rarityCaps = GuildWarService.getRarityCaps(+level, data.id);

                return sum(rarityCaps);
            },
            cellRenderer: (params: ICellRendererParams<IGWSection>) => {
                const data = params.data!;

                const rarityCaps = GuildWarService.getRarityCaps(+level, data.id);

                return (
                    <FlexBox gap={5}>
                        {rarityCaps.map((rarity, index) => (
                            <RarityImage key={index} rarity={rarity} />
                        ))}
                    </FlexBox>
                );
            },
        })),
    ]);

    return (
        <div className="ag-theme-material bf-table">
            <AgGridReact suppressCellFocus={true} columnDefs={columnDefs} rowHeight={35} rowData={rows}></AgGridReact>
        </div>
    );
};
