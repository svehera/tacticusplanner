import React, { useContext, useEffect, useMemo, useRef } from 'react';

import { AgGridReact } from 'ag-grid-react';
import { CellClickedEvent, ColDef, ICellRendererParams, RowClassParams, RowStyle } from 'ag-grid-community';

import { LreTile } from 'src/v2/features/lre/lre-tile';
import { StoreContext } from 'src/reducers/store.provider';
import { ICharacter2, ILegendaryEventTrack, ILegendaryEventTrackRequirement, ITableRow } from 'src/models/interfaces';
import { useFitGridOnWindowResize } from 'src/shared-logic/functions';
import { isMobile } from 'react-device-detect';

interface Props {
    track: ILegendaryEventTrack;
    rows: ITableRow[];
    editTeam: (teamId: string) => void;
    deleteTeam: (teamId: string) => void;
}

export const SelectedTeamsTable: React.FC<Props> = ({ rows, editTeam, deleteTeam, track }) => {
    const { viewPreferences } = useContext(StoreContext);
    const gridRef = useRef<AgGridReact>(null);

    const defaultColumnDef: ColDef<ITableRow> = {
        headerClass: 'center-header-text',
        resizable: true,
        sortable: false,
        suppressMovable: true,
        wrapHeaderText: true,
        cellRenderer: (props: ICellRendererParams<ICharacter2>) => {
            const character = props.value;
            if (character) {
                return <LreTile character={character} settings={viewPreferences} />;
            }
        },
        colSpan: params => {
            const indexOfCurrentCol = track.unitsRestrictions.findIndex(x => x.name === params.colDef.field);
            const restOfRestrictions = track.unitsRestrictions.slice(indexOfCurrentCol).map(x => x.name);
            if (restOfRestrictions.length === 1) {
                return 1;
            }

            const teamIds = restOfRestrictions.map(restriction => {
                const value = params.data?.[restriction];
                if (typeof value === 'object') {
                    return value.teamId ?? '';
                }
                return '';
            });

            let result = 1;
            let currTeamId = teamIds.shift();
            while (currTeamId && currTeamId === teamIds[0]) {
                result++;
                currTeamId = teamIds.shift();
            }

            return result;
        },
    };

    const columnsDefs = useMemo<Array<ColDef>>(
        () => getSectionColumns(track.unitsRestrictions.filter(x => !x.hide)),
        [track.eventId]
    );

    function getSectionColumns(unitsRestrictions: ILegendaryEventTrackRequirement[]): Array<ColDef> {
        return unitsRestrictions.map(u => ({
            field: u.name,
            headerName: u.name,
        }));
    }

    const handleCellCLick = (cellClicked: CellClickedEvent<ITableRow[], ICharacter2>) => {
        const value = cellClicked.value?.teamId;

        if (value) {
            if ((cellClicked.event as MouseEvent).shiftKey) {
                deleteTeam(value);
            } else {
                editTeam(value);
            }
        }
    };

    useEffect(() => {
        gridRef.current?.api?.sizeColumnsToFit();
    }, [viewPreferences.showAlpha, viewPreferences.showBeta, viewPreferences.showGamma, viewPreferences.hideCompleted]);

    const getRowStyle = (params: RowClassParams): RowStyle => {
        return params.node.rowIndex && params.node.rowIndex % 5 === 0 ? { borderTop: '5px dashed' } : {};
    };

    return (
        <div
            className="ag-theme-material auto-teams"
            style={{
                height: rows.length * 35,
                minHeight: '230px',
                width: '100%',
                minWidth: isMobile ? '750px' : '',
                border: '2px solid black',
            }}>
            <AgGridReact
                ref={gridRef}
                rowData={rows}
                rowHeight={35}
                getRowStyle={getRowStyle}
                defaultColDef={defaultColumnDef}
                columnDefs={columnsDefs}
                onCellClicked={handleCellCLick}
                onGridReady={useFitGridOnWindowResize(gridRef)}></AgGridReact>
        </div>
    );
};
