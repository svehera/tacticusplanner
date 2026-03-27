import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

// eslint-disable-next-line import-x/no-internal-modules
import { StoreContext } from '@/reducers/store.provider';

import { ICharacter2 } from '@/fsd/4-entities/character';

import { ILreTeam } from '@/fsd/3-features/lre';

import { SelectedTeamsTable } from './selected-teams-table';
import { buildSelectedTeamsRows, ISelectedTeamTableCell } from './selected-teams-table.utils';

interface IMockGridColumn {
    field: string;
    cellRenderer?: (props: {
        value: unknown;
        data: Record<string, unknown>;
        colDef: IMockGridColumn;
    }) => React.JSX.Element | undefined;
}

interface IMockGridProps {
    columnDefs?: IMockGridColumn[];
    defaultColDef?: Partial<IMockGridColumn>;
    rowData?: Record<string, unknown>[];
    onCellClicked?: (event: {
        value: unknown;
        data: Record<string, unknown>;
        colDef: IMockGridColumn;
        event: MouseEvent;
    }) => void;
}

vi.mock('react-device-detect', () => ({
    isMobile: false,
}));

vi.mock('@/fsd/5-shared/lib', () => ({
    useFitGridOnWindowResize: () => vi.fn(),
}));

vi.mock('./lre-tile', () => ({
    LreTile: ({ character }: { character: ICharacter2 }) => <span>{character.name}</span>,
}));

vi.mock('ag-grid-react', async () => {
    const ReactModule = await import('react');

    const AgGridReact = ReactModule.forwardRef<HTMLDivElement, IMockGridProps>((props, _reference) => {
        const mergedColumns = (props.columnDefs ?? []).map(column => ({
            ...props.defaultColDef,
            ...column,
        }));

        return (
            <div data-testid="mock-grid">
                {(props.rowData ?? []).map((row: Record<string, unknown>, rowIndex: number) =>
                    mergedColumns.map(column => {
                        const field = column.field;
                        const value = row[field];
                        const rendered = column.cellRenderer?.({
                            value,
                            data: row,
                            colDef: column,
                        });

                        return (
                            <button
                                key={`${rowIndex}-${field}`}
                                data-testid={`cell-${rowIndex}-${field}`}
                                onClick={event =>
                                    props.onCellClicked?.({
                                        value,
                                        data: row,
                                        colDef: column,
                                        event: event.nativeEvent,
                                    })
                                }>
                                {rendered ?? field}
                            </button>
                        );
                    })
                )}
            </div>
        );
    });

    return { AgGridReact };
});

const baseCharacter = {
    unitType: 'character',
    id: 'char-1',
    snowprintId: 'char-1',
    name: 'Bellator',
} as unknown as ICharacter2;

const makeTrack = () =>
    ({
        eventId: 'event-1',
        unitsRestrictions: [
            { name: 'Melee', hide: false },
            { name: 'Ranged', hide: false },
        ],
    }) as unknown as Parameters<typeof SelectedTeamsTable>[0]['track'];

const renderTable = (rows: Array<Record<string, ISelectedTeamTableCell | string>>, editTeam = vi.fn()) => {
    render(
        <StoreContext.Provider
            value={
                {
                    viewPreferences: {
                        showAlpha: true,
                        showBeta: true,
                        showGamma: true,
                        hideCompleted: false,
                    },
                } as unknown as React.ContextType<typeof StoreContext>
            }>
            <SelectedTeamsTable
                track={makeTrack()}
                rows={rows}
                upgradeRankOrMowGoals={[]}
                editTeam={editTeam}
                deleteTeam={vi.fn()}
            />
        </StoreContext.Provider>
    );

    return { editTeam };
};

describe('SelectedTeamsTable', () => {
    it('preserves team ids per column when the same character appears in multiple cells', () => {
        const teams = [
            {
                id: 'team-a',
                name: 'Team A',
                section: 'alpha',
                restrictionsIds: ['Melee'],
                charSnowprintIds: ['char-1'],
            },
            {
                id: 'team-b',
                name: 'Team B',
                section: 'alpha',
                restrictionsIds: ['Ranged'],
                charSnowprintIds: ['char-1'],
            },
        ] as ILreTeam[];

        const rows = buildSelectedTeamsRows(teams, { 'char-1': baseCharacter });

        expect((rows[0].Melee as ISelectedTeamTableCell).teamId).toBe('team-a');
        expect((rows[0].Ranged as ISelectedTeamTableCell).teamId).toBe('team-b');
    });

    it('edits the team for the clicked column even when the same character is repeated elsewhere', () => {
        const rows = buildSelectedTeamsRows(
            [
                {
                    id: 'team-a',
                    name: 'Team A',
                    section: 'alpha',
                    restrictionsIds: ['Melee'],
                    charSnowprintIds: ['char-1'],
                },
                {
                    id: 'team-b',
                    name: 'Team B',
                    section: 'alpha',
                    restrictionsIds: ['Ranged'],
                    charSnowprintIds: ['char-1'],
                },
            ] as ILreTeam[],
            { 'char-1': baseCharacter }
        );
        const { editTeam } = renderTable(rows);

        fireEvent.click(screen.getByTestId('cell-0-Melee'));
        fireEvent.click(screen.getByTestId('cell-0-Ranged'));

        expect(editTeam).toHaveBeenNthCalledWith(1, 'team-a');
        expect(editTeam).toHaveBeenNthCalledWith(2, 'team-b');
    });
});
