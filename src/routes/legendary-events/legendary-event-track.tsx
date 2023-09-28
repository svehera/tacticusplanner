import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';

import { AgGridReact } from 'ag-grid-react';
import {
    CellClassParams, CellClickedEvent,
    ColDef,
    ColGroupDef, 
    ICellRendererParams,
    ITooltipParams, 
    RowStyle,
} from 'ag-grid-community';

import {
    ICharacter,
    ILegendaryEventTrack,
    ILegendaryEventTrackRestriction,
    ITableRow,
    LegendaryEventSection
} from '../../models/interfaces';
import { ViewSettingsContext, AutoTeamsSettingsContext, LegendaryEventContext } from '../../contexts';
import { Rank, Rarity } from '../../models/enums';


import CustomTableHeader from './custom-table-header';
import { fitGridOnWindowResize } from '../../shared-logic/functions';
import { RowClassParams } from 'ag-grid-community/dist/lib/entities/gridOptions';
import { CharacterTitle } from '../../shared-components/character-title';

export const LegendaryEventTrack = ({ track, selectChars }: {
    track: ILegendaryEventTrack;
    selectChars: (team: string, ...chars: string[]) => void
}) => {
    const gridRef = useRef<AgGridReact>(null);

    const viewPreferences = useContext(ViewSettingsContext);
    const autoTeamsPreferences = useContext(AutoTeamsSettingsContext);
    const legendaryEvent = useContext(LegendaryEventContext);

    const components = useMemo(() => {
        return {
            agColumnHeader: CustomTableHeader,
        };
    }, []);

    const columnsDefs = useMemo<Array<ColGroupDef>>(() => [
        {
            headerName: track.name + ' - ' + track.killPoints,
            headerClass: track.section,
            children: getSectionColumns(track.unitsRestrictions, track.section),
            openByDefault: true
        },
    ], [legendaryEvent.id]);

    const [restrictions, setRestrictions] = useState<string[]>(() => track.unitsRestrictions.filter(x => x.core).map((x => x.name)));
    
    const teams = useMemo(() => track.suggestTeams(autoTeamsPreferences, restrictions), [autoTeamsPreferences, restrictions, legendaryEvent.allowedUnits]);

    const rows: Array<ITableRow> = useMemo(() => getRows(track, teams), [teams]);


    useEffect(() => {
        gridRef.current?.api?.sizeColumnsToFit();
    }, [viewPreferences.showAlpha, viewPreferences.showBeta, viewPreferences.showGamma, legendaryEvent.id]);


    const handleChange = (selected: boolean, restrictionName: string) => {
        if (selected) {
            setRestrictions(value => [...value, restrictionName]);
        } else {
            setRestrictions(value => value.filter(x => x !== restrictionName));
        }
    };

    const getRowStyle = (params: RowClassParams): RowStyle => {
        return params.node.rowIndex === 5 ? { borderTop: '5px dashed' } : {};
    };
    
    
    const handleCellCLick = (cellClicked: CellClickedEvent<ITableRow[], ICharacter>) => {
        const teamName = cellClicked.column.getColId();
        const value = cellClicked.value;
        const shiftKey = (cellClicked.event as MouseEvent).shiftKey;
        if(shiftKey) {
            const team =  teams[teamName].slice(0,5).map(x => x.name);
            selectChars(teamName,...team);
            return;
        }
        
        if(value && typeof value === 'object') {
            selectChars(teamName, value.name);
            return;
        }
    };

    function getSectionColumns(unitsRestrictions: ILegendaryEventTrackRestriction[], suffix: LegendaryEventSection): Array<ColDef> {
        return unitsRestrictions.map((u) => ({
            field: u.name,
            headerName: `(${u.points}) ${u.name}`,
            headerTooltip: `(${u.points}) ${u.name}`,
            cellRenderer: (props: ICellRendererParams<ICharacter>) => {
                const character = props.value;
                if(character) {
                    return <CharacterTitle character={character} imageSize={30}/>;
                }
            },
            cellClass: (params: CellClassParams) => typeof params.value === 'string' ? params.value : Rank[params.value?.rank]?.toLowerCase(),
            tooltipValueGetter: (params: ITooltipParams) => typeof params.value === 'string' ? params.value : params.value?.name + ' - ' + Rarity[params.value?.rarity ?? 0] + ' - ' + Rank[params.value?.rank ?? 0],
            section: suffix,
            suppressMovable: true,
            wrapHeaderText: true,
            autoHeaderHeight: true,
            headerComponentParams: {
                onCheckboxChange: (selected: boolean) => handleChange(selected, u.name),
                checked: u.core
            },
        }));

    }

    function getRows(legendaryEventTrack: ILegendaryEventTrack, teams: Record<string, ICharacter[]>): Array<ITableRow> {
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
        <div className="ag-theme-material auto-teams"
            style={{ height: 'calc((100vh - 160px) / 2)', width: '100%', border: '2px solid black' }}>
            <AgGridReact
                ref={gridRef}
                tooltipShowDelay={100}
                components={components}
                rowData={rows}
                rowHeight={35}
                getRowStyle={getRowStyle}
                columnDefs={columnsDefs}
                onGridReady={fitGridOnWindowResize(gridRef)}
                onCellClicked={handleCellCLick}
            >
            </AgGridReact>
        </div>
    );
};




