import React, { useContext, useEffect, useMemo, useRef } from 'react';

import { AgGridReact } from 'ag-grid-react';
import {
    CellClassParams, CellClickedEvent,
    ColDef,
    ColGroupDef,
    ITooltipParams, ValueFormatterParams
} from 'ag-grid-community';

import {
    ICharacter,
    ILegendaryEventTrack,
    ILegendaryEventTrackRestriction,
    ITableRow,
    LegendaryEventSection, SelectedTeams
} from '../../models/interfaces';
import { ViewSettingsContext, LegendaryEventContext } from '../../contexts';
import { Rank, Rarity } from '../../models/enums';


import { fitGridOnWindowResize } from '../../shared-logic/functions';

export const SelectedTeamsTable = (props: {
    track: ILegendaryEventTrack;
    teams: Record<string, Array<ICharacter | string>>;
    deselectChars: (teamName: string, ...chars: string[]) => void
}) => {
    const { track, teams, deselectChars } = props;
    const gridRef = useRef<AgGridReact>(null);

    const rows = useMemo(() => {
        const result: ITableRow[] = [{}, {}, {}, {}, {}];

        for (const teamKey in teams) {
            const team = teams[teamKey];
            for (let i = 0; i < team.length; i++) {
                result[i][teamKey] = team[i];
            }
        }
        return result;
    }, [teams]);

    const viewPreferences = useContext(ViewSettingsContext);
    const legendaryEvent = useContext(LegendaryEventContext);

    const columnsDefs = useMemo<Array<ColGroupDef>>(() => [
        {
            headerName: track.name,
            headerClass: track.section,
            children: getSectionColumns(track.unitsRestrictions),
            openByDefault: true
        },
    ], [legendaryEvent.id]);

    const handleCellCLick = (cellClicked: CellClickedEvent<ITableRow[], ICharacter>) => {
        const teamName = cellClicked.column.getColId();
        const value = cellClicked.value;
        const shiftKey = (cellClicked.event as MouseEvent).shiftKey;
        if (shiftKey) {
            const team = teams[teamName].map(x => typeof x === 'string' ? x : x.name);
            deselectChars(teamName, ...team);
            return;
        }

        if (value && typeof value === 'object') {
            deselectChars(teamName, value.name);
            return;
        }
    };


    useEffect(() => {
        gridRef.current?.api?.sizeColumnsToFit();
    }, [viewPreferences.showAlpha, viewPreferences.showBeta, viewPreferences.showGamma, legendaryEvent.id]);

    function getSectionColumns(unitsRestrictions: ILegendaryEventTrackRestriction[]): Array<ColDef> {
        return unitsRestrictions.map((u) => ({
            field: u.name,
            headerName: u.name,
            headerTooltip: u.name,
            valueFormatter: (params: ValueFormatterParams) => typeof params.value === 'string' ? params.value : params.value?.name,
            cellClass: (params: CellClassParams) => typeof params.value === 'string' ? params.value : Rank[params.value?.rank]?.toLowerCase(),
            tooltipValueGetter: (params: ITooltipParams) => typeof params.value === 'string' ? params.value : params.value?.name + ' - ' + Rarity[params.value?.rarity ?? 0] + ' - ' + Rank[params.value?.rank ?? 0],
            suppressMovable: true,
            wrapHeaderText: true,
        }));

    }

    return (
        <div className="ag-theme-material auto-teams"
            style={{ height: '240px', width: '100%', border: '2px solid black' }}>
            <AgGridReact
                ref={gridRef}
                tooltipShowDelay={100}
                rowData={rows}
                columnDefs={columnsDefs}
                onGridReady={fitGridOnWindowResize(gridRef)}
                onCellClicked={handleCellCLick}
            >
            </AgGridReact>
        </div>
    );
};




