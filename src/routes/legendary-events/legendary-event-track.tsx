import React, { useContext, useEffect, useMemo, useRef } from 'react';

import { AgGridReact } from 'ag-grid-react';
import {
    CellClassParams,
    CellClickedEvent,
    ColDef,
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
import { LegendaryEventEnum, Rank, Rarity } from '../../models/enums';

import CustomTableHeader from './custom-table-header';
import { fitGridOnWindowResize } from '../../shared-logic/functions';
import { RowClassParams } from 'ag-grid-community/dist/lib/entities/gridOptions';
import { CharacterTitle } from '../../shared-components/character-title';
import { DispatchContext, StoreContext } from '../../reducers/store.provider';
import { isMobile } from 'react-device-detect';
import InfoIcon from '@mui/icons-material/Info';
import { FlexBox } from 'src/v2/components/flex-box';

export const LegendaryEventTrack = ({
    track,
    selectChars,
    show,
    completedRequirements,
}: {
    show: boolean;
    track: ILegendaryEventTrack;
    selectChars: (team: string, ...chars: string[]) => void;
    completedRequirements: string[];
}) => {
    const gridRef = useRef<AgGridReact>(null);

    const { viewPreferences, autoTeamsPreferences, leSelectedRequirements, selectedTeamOrder } =
        useContext(StoreContext);
    const dispatch = useContext(DispatchContext);

    const restrictions = useMemo(() => {
        const event: ILegendaryEventSelectedRequirements = leSelectedRequirements[track.eventId] ?? {
            id: track.eventId,
            name: LegendaryEventEnum[track.eventId],
            alpha: {},
            beta: {},
            gamma: {},
        };
        const section = event[track.section];
        const result: string[] = [];

        track.unitsRestrictions.forEach(x => {
            const selected = section[x.name] !== undefined ? section[x.name] : x.selected;
            if (selected && !completedRequirements.includes(x.name)) {
                result.push(x.name);
            }
        });

        return result;
    }, [leSelectedRequirements, completedRequirements]);

    const components = useMemo(() => {
        return {
            agColumnHeader: CustomTableHeader,
        };
    }, [restrictions]);

    const columnsDefs = useMemo<Array<ColDef>>(
        () => [
            ...getSectionColumns(
                track.unitsRestrictions,
                track.section,
                viewPreferences.lightWeight,
                viewPreferences.hideNames,
                restrictions,
                completedRequirements
            ),
        ],
        [track.eventId, viewPreferences.lightWeight, viewPreferences.hideNames, restrictions, completedRequirements]
    );

    const teams = useMemo(
        () =>
            track.suggestTeams(
                viewPreferences.autoTeams ? autoTeamsPreferences : selectedTeamOrder,
                viewPreferences.onlyUnlocked,
                restrictions
            ),
        [autoTeamsPreferences, restrictions, viewPreferences.autoTeams, viewPreferences.onlyUnlocked, selectedTeamOrder]
    );

    const rows: Array<ITableRow> = useMemo(() => getRows(teams), [teams]);

    useEffect(() => {
        gridRef.current?.api?.sizeColumnsToFit();
    }, [
        viewPreferences.showAlpha,
        viewPreferences.showBeta,
        viewPreferences.showGamma,
        track.eventId,
        viewPreferences.hideCompleted,
    ]);

    const handleChange = (selected: boolean, restrictionName: string) => {
        dispatch.leSelectedRequirements({
            type: 'Update',
            eventId: track.eventId,
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
        if (shiftKey && viewPreferences.autoTeams) {
            const team = teams[teamName].slice(0, 5).map(x => x?.name ?? '');
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
        hideNames: boolean,
        selectedRequirements: string[],
        completedRestrictions: string[]
    ): Array<ColDef> {
        return unitsRestrictions.map(u => ({
            field: u.name,
            headerName: `(${u.points}) ${u.name}`,
            headerTooltip: `(${u.points}) ${u.name}`,
            headerClass: suffix,
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
                          return <CharacterTitle character={character} imageSize={30} hideName={hideNames} />;
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
            hide: completedRestrictions.includes(u.name),
            headerComponentParams: {
                onCheckboxChange: (selected: boolean) => handleChange(selected, u.name),
                checked: selectedRequirements.includes(u.name),
            },
        }));
    }

    function getRows(teams: Record<string, Array<ICharacter2 | undefined>>): Array<ITableRow> {
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
        <div style={{ width: '100%', display: show ? 'block' : 'none', overflow: 'auto' }}>
            <span style={{ fontWeight: 700, fontSize: 18 }}>{track.name + ' - ' + track.killPoints}</span>
            <FlexBox gap={5}>
                <span style={{ fontStyle: 'italic', fontSize: 18 }}> vs {track.enemies.label}</span>
                <a href={track.enemies.link} target={'_blank'} rel="noreferrer">
                    <InfoIcon color={'primary'} />
                </a>
            </FlexBox>
            <div
                className="ag-theme-material auto-teams"
                style={{
                    height: isMobile ? '350px' : `calc((100vh - 250px) / ${viewPreferences.hideSelectedTeams ? 1 : 2})`,
                    width: '100%',
                    minWidth: isMobile ? '750px' : '',
                    border: '2px solid black',
                }}>
                <AgGridReact
                    ref={gridRef}
                    tooltipShowDelay={100}
                    components={components}
                    rowData={rows}
                    headerHeight={80}
                    rowHeight={35}
                    getRowStyle={viewPreferences.autoTeams ? getRowStyle : undefined}
                    columnDefs={columnsDefs}
                    onGridReady={fitGridOnWindowResize(gridRef)}
                    onCellClicked={handleCellCLick}></AgGridReact>
            </div>
        </div>
    );
};
