import React, { useContext, useMemo } from 'react';
import { enqueueSnackbar } from 'notistack';

import { ICharacter2, ILegendaryEvent, ILreTeam, LegendaryEventSection, SelectedTeams } from '../../models/interfaces';
import { LegendaryEventTrack } from './legendary-event-track';
import { SelectedTeamsTable } from './selected-teams-table';

import DataTablesDialog from './data-tables-dialog';
import { Info } from '@mui/icons-material';
import { FormControl, FormControlLabel, MenuItem, Select, Switch, Tooltip } from '@mui/material';
import InputLabel from '@mui/material/InputLabel';
import { orderBy } from 'lodash';
import { SetGoalDialog } from '../../shared-components/goals/set-goal-dialog';
import { MyProgressDialog } from './my-progress-dialog';
import { DispatchContext, StoreContext } from '../../reducers/store.provider';
import { isMobile } from 'react-device-detect';
import TableRowsIcon from '@mui/icons-material/TableRows';
import GridViewIcon from '@mui/icons-material/GridView';

export const LegendaryEvent = ({ legendaryEvent }: { legendaryEvent: ILegendaryEvent }) => {
    const { characters, viewPreferences, leSelectedTeams, leProgress } = useContext(StoreContext);
    const dispatch = useContext(DispatchContext);

    const selectedTeams: ILreTeam[] = leSelectedTeams[legendaryEvent.id]?.teams ?? [];

    const updateView = (gridView: boolean): void => {
        dispatch.viewPreferences({ type: 'Update', setting: 'lreGridView', value: gridView });
    };

    const selectChars =
        (section: LegendaryEventSection) =>
        (team: string, ...chars: string[]) => {
            // dispatch.leSelectedTeams({ type: 'SelectChars', eventId: legendaryEvent.id, section, chars, team });
            // enqueueSnackbar(`${chars.join(',')} added to ${team} of ${section} sector`, { variant: 'success' });
        };

    const deselectChars =
        (section: LegendaryEventSection) =>
        (team: string, ...chars: string[]) => {
            // dispatch.leSelectedTeams({ type: 'DeselectChars', eventId: legendaryEvent.id, section, chars, team });
            // enqueueSnackbar(`${chars.join(',')} removed from ${team} of ${section} sector`, { variant: 'warning' });
        };

    const getCompletedRequirements = (section: LegendaryEventSection): string[] => {
        const eventProgress = leProgress[legendaryEvent.id];
        const sectionProgress = eventProgress && eventProgress[section];
        const track = legendaryEvent[section];

        if (sectionProgress) {
            const completedRequirements = Array.from({ length: sectionProgress.battles[0].length }, (_, i) =>
                sectionProgress.battles.map(arr => arr[i])
            )
                .slice(2)
                .map(x => x.every(battle => battle));

            return track.unitsRestrictions
                .map((x, index) => (completedRequirements[index] ? x.name : ''))
                .filter(x => !!x);
        }

        return [];
    };

    const alphaCompletedRequirements = useMemo(
        () => getCompletedRequirements('alpha'),
        [leProgress, legendaryEvent.id]
    );
    const betaCompletedRequirements = useMemo(() => getCompletedRequirements('beta'), [leProgress, legendaryEvent.id]);
    const gammaCompletedRequirements = useMemo(
        () => getCompletedRequirements('gamma'),
        [leProgress, legendaryEvent.id]
    );

    return (
        <div>
            <div
                style={{ display: 'flex', flexWrap: isMobile ? 'wrap' : 'nowrap', gap: 15, marginBottom: 10 }}
                key={legendaryEvent.id}>
                <LegendaryEventTrack
                    show={viewPreferences.showAlpha}
                    track={legendaryEvent.alpha}
                    selectChars={selectChars('alpha')}
                    completedRequirements={viewPreferences.hideCompleted ? alphaCompletedRequirements : []}
                />
                <LegendaryEventTrack
                    show={viewPreferences.showBeta}
                    track={legendaryEvent.beta}
                    selectChars={selectChars('beta')}
                    completedRequirements={viewPreferences.hideCompleted ? betaCompletedRequirements : []}
                />
                <LegendaryEventTrack
                    show={viewPreferences.showGamma}
                    track={legendaryEvent.gamma}
                    selectChars={selectChars('gamma')}
                    completedRequirements={viewPreferences.hideCompleted ? gammaCompletedRequirements : []}
                />
            </div>
            <div>
                <div className="flex-box">
                    <span>Selected teams</span>
                    <Switch
                        checked={viewPreferences.lreGridView}
                        onChange={event => updateView(event.target.checked)}
                    />
                    {viewPreferences.lreGridView ? <GridViewIcon color="primary" /> : <TableRowsIcon color="primary" />}
                </div>
                <div
                    style={{ display: 'flex', flexWrap: isMobile ? 'wrap' : 'nowrap', gap: 15, overflow: 'auto' }}
                    key={legendaryEvent.id}>
                    <SelectedTeamsTable
                        show={viewPreferences.showAlpha}
                        track={legendaryEvent.alpha}
                        teams={selectedTeams.filter(x => x.section === 'alpha')}
                        deselectChars={deselectChars('alpha')}
                        completedRequirements={viewPreferences.hideCompleted ? alphaCompletedRequirements : []}
                    />
                    <SelectedTeamsTable
                        show={viewPreferences.showBeta}
                        track={legendaryEvent.beta}
                        teams={selectedTeams.filter(x => x.section === 'beta')}
                        deselectChars={deselectChars('beta')}
                        completedRequirements={viewPreferences.hideCompleted ? betaCompletedRequirements : []}
                    />
                    <SelectedTeamsTable
                        show={viewPreferences.showGamma}
                        track={legendaryEvent.gamma}
                        teams={selectedTeams.filter(x => x.section === 'gamma')}
                        deselectChars={deselectChars('gamma')}
                        completedRequirements={viewPreferences.hideCompleted ? gammaCompletedRequirements : []}
                    />
                </div>
            </div>
        </div>
    );
};
