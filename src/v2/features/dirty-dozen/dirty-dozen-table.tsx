import React from 'react';
import './dirty-dozen-table.css';
import { IDirtyDozenChar } from './dirty-dozen.models';
import { AgGridReact } from 'ag-grid-react';
import { AllCommunityModule, ColDef, ICellRendererParams, ValueGetterParams, themeBalham } from 'ag-grid-community';
import { Score } from 'src/v2/features/dirty-dozen/dirty-dozen-score';
import { CharacterTitle } from 'src/shared-components/character-title';
import { RarityImage } from 'src/v2/components/images/rarity-image';
import { RankImage } from 'src/v2/components/images/rank-image';
import { ICharacter2 } from 'src/models/interfaces';

interface Props {
    characters: ICharacter2[];
    rows: IDirtyDozenChar[];
    columns: Array<[string, string]>;
}

export const DirtyDozenTable: React.FC<Props> = ({ characters, rows, columns }) => {
    const defaultColDef: ColDef<IDirtyDozenChar> = {
        sortable: true,
        resizable: true,
    };

    const createScoreColumn = (field: string, headerName: string): ColDef<IDirtyDozenChar> => {
        return {
            field,
            headerName,
            width: 80,
            cellRenderer: (params: ICellRendererParams<IDirtyDozenChar, number>) => {
                const { value } = params;
                return <Score value={value ?? 0} />;
            },
            headerClass: 'score',
            sortingOrder: ['desc', null],
        } as ColDef<IDirtyDozenChar>;
    };

    const columnDefs: Array<ColDef> = [
        {
            headerName: '#',
            field: 'Position',
            maxWidth: 30,
        },
        {
            field: 'Name',
            headerName: 'Name',
            width: 150,
            cellRenderer: (props: ICellRendererParams<IDirtyDozenChar>) => {
                const characterId = props.data?.Name;
                const character = characters.find(x => x.name === characterId);
                if (character) {
                    return <CharacterTitle character={character} imageSize={30} short />;
                } else {
                    return characterId;
                }
            },
        },
        {
            headerName: 'Rarity',
            width: 60,
            valueGetter: (props: ValueGetterParams<IDirtyDozenChar>) => {
                const characterId = props.data?.Name;
                const character = characters.find(x => x.name === characterId);
                return character?.rarity;
            },
            cellRenderer: (props: ICellRendererParams<IDirtyDozenChar>) => {
                const rarity = props.value ?? 0;
                return <RarityImage rarity={rarity} />;
            },
        },
        {
            headerName: 'Rank',
            width: 60,
            valueGetter: (props: ValueGetterParams<IDirtyDozenChar>) => {
                const characterId = props.data?.Name;
                const character = characters.find(x => x.name === characterId);
                return character?.rank;
            },
            cellRenderer: (props: ICellRendererParams<IDirtyDozenChar>) => {
                const rank = props.value ?? 0;
                return <RankImage rank={rank} />;
            },
        },
        {
            headerName: 'GR Team',
            field: 'GRTeam',
            width: 80,
            hide: !rows.some(x => !!x.GRTeam),
        },
        ...columns.map(([field, header]) => createScoreColumn(field, header)),
    ];

    return (
        <div className="ag-theme-material dirty-dozen-table">
            <AgGridReact
                modules={[AllCommunityModule]}
                theme={themeBalham}
                suppressCellFocus={true}
                defaultColDef={defaultColDef}
                columnDefs={columnDefs}
                rowHeight={35}
                rowData={rows}></AgGridReact>
        </div>
    );
};
