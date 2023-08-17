import React from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ColDef, ColGroupDef, RowStyle, ValueFormatterParams } from 'ag-grid-community';
import { RowClassParams } from 'ag-grid-community/dist/lib/entities/gridOptions';
import { ICharacter, IUnitData } from '../../store/static-data/interfaces';
import GlobalStoreService from '../../store/global-store.service';
import { DamageTypes, Traits } from '../../store/static-data/enums';
import { PersonalDataService } from '../../store/personal-data/personal-data.service';
import RankSelectorCell from '../rank-selector-cell/rank-selector-cell';
import UnlockedCheckboxCell from '../unlocked-checkbox-cell/unlocked-checkbox-cell';

type EnumLike<T> = Record<string, T>

const WhoYouOwn = () => {
    const defaultColDef: ColDef<IUnitData> = {
        sortable: true,
        resizable: true,
        filter: 'agTextColumnFilter',
        menuTabs: ['filterMenuTab'],
    };

    const rowsData = GlobalStoreService.characters;

    const getRowStyle = (params: RowClassParams<IUnitData>): RowStyle => {
        return { background: (params.node.rowIndex ?? 0) % 2 === 0 ? 'silver' : 'white' };
    };

    const convertEnumValuesToString = (
        damageTypesEnum: EnumLike<number>
    ) => (
        params: ValueFormatterParams<IUnitData, number>
    ): string => {
        const typeNames: string[] = [];
        const value = params.value ?? 0;

        for (const key in damageTypesEnum) {
            if (typeof damageTypesEnum[key] === 'number' && value & damageTypesEnum[key]) {
                typeNames.push(key);
            }
        }

        return typeNames.join(', ');
    };


    const columnDefs: Array<ColDef | ColGroupDef> = [
        { field: 'numberAdded', headerName: 'Number Added' },
        {
            headerName: 'Faction Details',
            children: [
                { field: 'name', headerName: 'Name' },
                { field: 'alliance', headerName: 'Alliance', columnGroupShow: 'open' },
                { field: 'faction', headerName: 'Faction', columnGroupShow: 'open' }
            ],
        },
        {
            headerName: 'Owner data',
            children: [
                {
                    headerName: 'Unlocked',
                    editable: true,
                    cellRenderer: UnlockedCheckboxCell,
                },
                {
                    headerName: 'Rank',
                    editable: true,
                    cellRenderer: RankSelectorCell,
                    columnGroupShow: 'open',
                }
            ]
        },
        {
            headerName: 'Stats details',
            children: [
                {
                    field: 'damageTypes',
                    headerName: 'Damage Types',
                    valueFormatter: convertEnumValuesToString(DamageTypes as unknown as EnumLike<number>)
                },
                {
                    field: 'traits',
                    headerName: 'Traits',
                    valueFormatter: convertEnumValuesToString(Traits as unknown as EnumLike<number>)
                },
                { field: 'meleeHits', headerName: 'Melee Hits', columnGroupShow: 'open' },
                { field: 'rangeHits', headerName: 'Range Hits', columnGroupShow: 'open' },
                { field: 'rangeDistance', headerName: 'Range Distance', columnGroupShow: 'open' },
                { field: 'movement', headerName: 'Movement', columnGroupShow: 'open' }
            ]
        }

    ];

    const saveChanges = () => {
        PersonalDataService.data.characters = rowsData.map(row => ({ name: row.name, unlocked: row.unlocked, rank: row.rank! }));
        PersonalDataService.save();
    };

    return (
        <div className="ag-theme-material" style={{ height: 600, width: '100%' }}>
            <AgGridReact
                suppressCellFocus={true}
                defaultColDef={defaultColDef}
                columnDefs={columnDefs}
                rowData={rowsData}
                getRowStyle={getRowStyle}
                onCellEditingStopped={saveChanges}
            >
            </AgGridReact>
        </div>
    );
};

export default WhoYouOwn;