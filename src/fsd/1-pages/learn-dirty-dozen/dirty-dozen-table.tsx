import { AllCommunityModule, ColDef, ICellRendererParams, ValueGetterParams, themeBalham } from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';
import React from 'react';

import { RarityIcon } from '@/fsd/5-shared/ui/icons';

import { CharactersService, CharacterTitle, ICharacter2, RankIcon } from '@/fsd/4-entities/character';

import { Score } from './dirty-dozen-score';
import { IDirtyDozenChar } from './dirty-dozen.models';

interface Properties {
    characters: ICharacter2[];
    rows: IDirtyDozenChar[];
    columns: Array<[string, string]>;
}

export const DirtyDozenTable: React.FC<Properties> = ({ characters, rows, columns }) => {
    const defaultColumnDefinition: ColDef<IDirtyDozenChar> = {
        sortable: true,
        resizable: true,
    };

    const createScoreColumn = (field: string, headerName: string): ColDef<IDirtyDozenChar> => {
        return {
            field,
            headerName,
            width: 80,
            cellRenderer: (parameters: ICellRendererParams<IDirtyDozenChar, number>) => {
                const { value } = parameters;
                return <Score value={value ?? 0} />;
            },
            headerClass: '[&_.ag-header-cell-text]:w-full [&_.ag-header-cell-text]:text-center',
            sortingOrder: ['desc', undefined],
        } as ColDef<IDirtyDozenChar>;
    };

    const columnDefs: Array<ColDef> = [
        {
            headerName: '#',
            field: 'Position',
            maxWidth: 32,
        },
        {
            field: 'Name',
            headerName: 'Name',
            width: 200,
            cellRenderer: (properties: ICellRendererParams<IDirtyDozenChar>) => {
                const characterId = properties.data?.Name ?? '';
                const character = characters.find(char => CharactersService.matchesAnyCharacterId(characterId, char));
                return character ? <CharacterTitle character={character} imageSize={30} short /> : characterId;
            },
        },
        {
            headerName: 'Rarity',
            width: 60,
            valueGetter: (properties: ValueGetterParams<IDirtyDozenChar>) => {
                const characterId = properties.data?.Name ?? '';
                const character = characters.find(char => CharactersService.matchesAnyCharacterId(characterId, char));
                return character?.rarity;
            },
            cellRenderer: (properties: ICellRendererParams<IDirtyDozenChar>) => {
                const rarity = properties.value ?? 0;
                return <RarityIcon rarity={rarity} />;
            },
        },
        {
            headerName: 'Rank',
            width: 60,
            valueGetter: (properties: ValueGetterParams<IDirtyDozenChar>) => {
                const characterId = properties.data?.Name ?? '';
                const character = characters.find(char => CharactersService.matchesAnyCharacterId(characterId, char));
                return character?.rank;
            },
            cellRenderer: (properties: ICellRendererParams<IDirtyDozenChar>) => {
                const rank = properties.value ?? 0;
                return <RankIcon rank={rank} />;
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
        <div className="ag-theme-material h-[calc(100vh_-_130px)] w-full">
            <AgGridReact
                modules={[AllCommunityModule]}
                theme={themeBalham}
                suppressCellFocus={true}
                defaultColDef={defaultColumnDefinition}
                columnDefs={columnDefs}
                rowHeight={35}
                rowData={rows}></AgGridReact>
        </div>
    );
};
