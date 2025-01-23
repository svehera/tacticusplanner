import React, { useState } from 'react';
import './dirty-dozen-table.css';
import { IDirtyDozenChar } from './dirty-dozen.models';
import { AgGridReact } from 'ag-grid-react';
import { ColDef, ColGroupDef, ICellRendererParams, ValueGetterParams } from 'ag-grid-community';
import { Score } from 'src/v2/features/dirty-dozen/dirty-dozen-score';
import { CharacterTitle } from 'src/shared-components/character-title';
import { RarityImage } from 'src/v2/components/images/rarity-image';
import { RankImage } from 'src/v2/components/images/rank-image';
import { ICharacter2 } from 'src/models/interfaces';

export const DirtyDozenTable = ({ characters, rows }: { characters: ICharacter2[]; rows: IDirtyDozenChar[] }) => {
    const defaultColDef: ColDef<IDirtyDozenChar> = {
        sortable: true,
        resizable: true,
    };

    const createScoreColumn = (field: keyof IDirtyDozenChar, headerName: string): ColDef<IDirtyDozenChar> => {
        return {
            field,
            headerName,
            width: 100,
            cellRenderer: (params: ICellRendererParams<IDirtyDozenChar, number>) => {
                const { value } = params;
                return <Score value={value ?? 0} />;
            },
            headerClass: 'score',
            sortingOrder: ['desc', null],
        } as ColDef<IDirtyDozenChar>;
    };

    const [columnDefs] = useState<Array<ColDef | ColGroupDef>>([
        {
            field: 'Position',
            maxWidth: 90,
        },
        {
            field: 'Name',
            headerName: 'Name',
            width: 200,
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
            width: 80,
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
            width: 80,
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

        createScoreColumn('Horde', 'Horde'),
        createScoreColumn('GuildWar', 'Guild War'),
        createScoreColumn('GuildRaid', 'Guild Raid'),
        createScoreColumn('ModifiedScore', 'Modified Score'),
    ]);

    return (
        <div className="ag-theme-material dirty-dozen-table">
            <AgGridReact
                suppressCellFocus={true}
                defaultColDef={defaultColDef}
                columnDefs={columnDefs}
                rowHeight={35}
                rowData={rows}></AgGridReact>
        </div>
    );
};
