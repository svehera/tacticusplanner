import React, { useContext, useEffect, useMemo, useRef } from 'react';

import { AgGridReact } from 'ag-grid-react';
import {
    CellClassParams,
    CellClickedEvent,
    ColDef,
    ColGroupDef,
    ICellRendererParams,
    ITooltipParams,
    RowStyle,
    ValueFormatterParams,
} from 'ag-grid-community';

import {
    ICharacter2,
    ILegendaryEventSelectedRequirements,
    ILegendaryEventTrack,
    ILegendaryEventTrackRequirement,
    ITableRow,
    LegendaryEventSection,
} from '../../models/interfaces';
import { LegendaryEventContext } from '../../contexts';
import { LegendaryEventEnum, Rank, Rarity } from '../../models/enums';

import CustomTableHeader from './custom-table-header';
import { fitGridOnWindowResize } from '../../shared-logic/functions';
import { RowClassParams } from 'ag-grid-community/dist/lib/entities/gridOptions';
import { CharacterTitle } from '../../shared-components/character-title';
import { DispatchContext, StoreContext } from '../../reducers/store.provider';

export const LegendaryEventTrack = ({
    track,
    selectChars,
    show,
}: {
    show: boolean;
    track: ILegendaryEventTrack;
    selectChars: (team: string, ...chars: string[]) => void;
}) => {
    const gridRef = useRef<AgGridReact>(null);
    const legendaryEvent = useContext(LegendaryEventContext);

    const { viewPreferences, autoTeamsPreferences, leSelectedRequirements } = useContext(StoreContext);
    const dispatch = useContext(DispatchContext);

    const restrictions = useMemo(() => {
        const event: ILegendaryEventSelectedRequirements = leSelectedRequirements[legendaryEvent.id] ?? {
            id: legendaryEvent.id,
            name: LegendaryEventEnum[legendaryEvent.id],
            alpha: {},
            beta: {},
            gamma: {},
        };
        const section = event[track.section];
        const result: string[] = [];

        track.unitsRestrictions.forEach(x => {
            const selected = section[x.name] !== undefined ? section[x.name] : x.selected;
            if (selected) {
                result.push(x.name);
            }
        });

        return result;
    }, [leSelectedRequirements]);

    const components = useMemo(() => {
        return {
            agColumnHeader: CustomTableHeader,
        };
    }, [restrictions]);

    const columnsDefs = useMemo<Array<ColGroupDef>>(
        () => [
            {
                headerName: track.name + ' - ' + track.killPoints,
                headerClass: track.section,
                children: getSectionColumns(
                    track.unitsRestrictions,
                    track.section,
                    viewPreferences.lightWeight,
                    restrictions
                ),
                openByDefault: true,
            },
        ],
        [legendaryEvent.id, viewPreferences.lightWeight, restrictions]
    );

    const teams = useMemo(
        () => track.suggestTeams(autoTeamsPreferences, restrictions),
        [autoTeamsPreferences, restrictions, legendaryEvent.allowedUnits]
    );

    const rows: Array<ITableRow> = useMemo(() => getRows(track, teams), [teams]);

    useEffect(() => {
        gridRef.current?.api?.sizeColumnsToFit();
    }, [viewPreferences.showAlpha, viewPreferences.showBeta, viewPreferences.showGamma, legendaryEvent.id]);

    const handleChange = (selected: boolean, restrictionName: string) => {
        dispatch.leSelectedRequirements({
            type: 'Update',
            eventId: legendaryEvent.id,
            section: track.section,
            restrictionName,
            selected,
        });
    };

    const getRowStyle = (params: RowClassParams): RowStyle => {
        return params.node.rowIndex === 5 ? { borderTop: '5px dashed' } : {};
    };

    const handleCellCLick = (cellClicked: CellClickedEvent<ITableRow[], ICharacter2>) => {
        const teamName = cellClicked.column.getColId();
        const value = cellClicked.value;
        const shiftKey = (cellClicked.event as MouseEvent).shiftKey;
        if (shiftKey) {
            const team = teams[teamName].slice(0, 5).map(x => x.name);
            selectChars(teamName, ...team);
            return;
        }

        if (value && typeof value === 'object') {
            selectChars(teamName, value.name);
            return;
        }
    };

    function getSectionColumns(
        unitsRestrictions: ILegendaryEventTrackRequirement[],
        suffix: LegendaryEventSection,
        lightweight: boolean,
        selectedRequirements: string[]
    ): Array<ColDef> {
        return unitsRestrictions.map(u => ({
            field: u.name,
            headerName: `(${u.points}) ${u.name}`,
            headerTooltip: `(${u.points}) ${u.name}`,
            resizable: true,
            valueFormatter: !lightweight
                ? undefined
                : (params: ValueFormatterParams) =>
                      typeof params.value === 'string' ? params.value : params.value?.name,
            cellRenderer: lightweight
                ? undefined
                : (props: ICellRendererParams<ICharacter2>) => {
                      const character = props.value;
                      if (character) {
                          return <CharacterTitle character={character} imageSize={30} />;
                      }
                  },
            cellClass: (params: CellClassParams) =>
                typeof params.value === 'string' ? params.value : Rank[params.value?.rank]?.toLowerCase(),
            tooltipValueGetter: (params: ITooltipParams) =>
                typeof params.value === 'string'
                    ? params.value
                    : params.value?.name +
                      ' - ' +
                      Rarity[params.value?.rarity ?? 0] +
                      ' - ' +
                      Rank[params.value?.rank ?? 0],
            section: suffix,
            suppressMovable: true,
            wrapHeaderText: true,
            autoHeaderHeight: true,
            headerComponentParams: {
                onCheckboxChange: (selected: boolean) => handleChange(selected, u.name),
                checked: selectedRequirements.includes(u.name),
            },
        }));
    }

    function getRows(
        legendaryEventTrack: ILegendaryEventTrack,
        teams: Record<string, ICharacter2[]>
    ): Array<ITableRow> {
        const size = Math.max(...Object.values(teams).map(x => x.length));
        const rows: Array<ITableRow> = Array.from({ length: size }, () => ({}));

        rows.forEach((row, index) => {
            for (const team in teams) {
                const char = teams[team][index];
                row[team] = char ?? '';
            }
        });

        return rows;
    }

    return (
        <div
            className="ag-theme-material auto-teams"
            style={{
                display: show ? 'block' : 'none',
                height: `calc((100vh - 200px) / ${viewPreferences.hideSelectedTeams ? 1 : 2})`,
                width: '100%',
                border: '2px solid black',
            }}>
            <AgGridReact
                ref={gridRef}
                tooltipShowDelay={100}
                components={components}
                rowData={rows}
                rowHeight={35}
                getRowStyle={getRowStyle}
                columnDefs={columnsDefs}
                onGridReady={fitGridOnWindowResize(gridRef)}
                onCellClicked={handleCellCLick}></AgGridReact>
        </div>
    );
};
