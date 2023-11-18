import React, { useContext, useState } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ColDef, ColGroupDef, ICellRendererParams } from 'ag-grid-community';
import Typography from '@mui/material/Typography';
import { Link } from 'react-router-dom';
import { IDirtyDozenChar } from '../../models/interfaces';
import { StaticDataService } from '../../services';
import { CharacterTitle } from '../../shared-components/character-title';
import { StoreContext } from '../../reducers/store.provider';

import './dirty-dozen.css';
import { ValueGetterParams } from 'ag-grid-community/dist/lib/entities/colDef';
import { RankImage } from '../../shared-components/rank-image';
import { Info } from '@mui/icons-material';

export const DirtyDozen = () => {
    const { characters } = useContext(StoreContext);

    const defaultColDef: ColDef<IDirtyDozenChar> = {
        sortable: true,
        resizable: true,
    };

    const createScoreColumn = (
        field: keyof IDirtyDozenChar,
        headerName: string,
        bgcolorClass: ScoreBgClass
    ): ColDef<IDirtyDozenChar> => {
        return {
            field,
            headerName,
            width: 100,
            cellRenderer: (params: ICellRendererParams<IDirtyDozenChar, number>) => {
                const { value } = params;
                return <Score value={value ?? 0} bgcolorClass={bgcolorClass} />;
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
            headerName: 'Rank',
            width: 80,
            valueGetter: (props: ValueGetterParams<IDirtyDozenChar>) => {
                const characterId = props.data?.Name;
                const character = characters.find(x => x.name === characterId);
                if (character) {
                    return character.rank;
                } else {
                    return characterId;
                }
            },
            cellRenderer: (props: ICellRendererParams<IDirtyDozenChar>) => {
                const rank = props.value ?? 0;
                return <RankImage rank={rank} />;
            },
        },
        createScoreColumn('Pvp', 'PvP', 'pvp'),
        createScoreColumn('GRTyranid', 'Tyranids', 'tyranids'),
        createScoreColumn('GRNecron', 'Necron', 'necron'),
        createScoreColumn('GROrk', 'Ork', 'ork'),
        createScoreColumn('GRMortarion', 'Mortarion', 'mortarion'),
        createScoreColumn('GRScreamer', 'Screamer', 'screamer'),
    ]);

    return (
        <div style={{ margin: 20 }}>
            <Typography variant="subtitle1" component="div" sx={{ flexGrow: 1 }}>
                Based on{' '}
                <Link to={'https://tacticus.fandom.com/wiki/Infographics#Dirty_Dozen_Series'} target={'_blank'}>
                    Nandi&apos;s infographics{' '}
                </Link>{' '}
                (October 2023)
            </Typography>
            <div style={{ display: 'flex', alignItems: 'center' }}>
                <Info /> Hold Shift to sort by multiple columns
            </div>

            <div className="ag-theme-material" style={{ height: 'calc(100vh - 130px)', width: '100%' }}>
                <AgGridReact
                    suppressCellFocus={true}
                    defaultColDef={defaultColDef}
                    columnDefs={columnDefs}
                    rowHeight={35}
                    rowData={StaticDataService.dirtyDozenData}></AgGridReact>
            </div>
        </div>
    );
};

type ScoreBgClass = 'pvp' | 'tyranids' | 'necron' | 'ork' | 'mortarion' | 'screamer';

const Score = ({ value, bgcolorClass }: { value: number; bgcolorClass: ScoreBgClass }) => (
    <div className="dirty-dozen-score-container">
        <div className={`dirty-dozen-score ${bgcolorClass}`}>{value}</div>
    </div>
);
