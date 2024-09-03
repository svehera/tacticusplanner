import React, { useContext, useMemo } from 'react';
import { enqueueSnackbar } from 'notistack';

import { ICharacter2, ILegendaryEvent, LegendaryEventSection, SelectedTeams } from '../../models/interfaces';
import { LegendaryEventTrack } from './legendary-event-track';
import { SelectedTeamsTable } from './selected-teams-table';

import DataTablesDialog from './data-tables-dialog';
import { Info } from '@mui/icons-material';
import { FormControl, MenuItem, Select, Tooltip } from '@mui/material';
import InputLabel from '@mui/material/InputLabel';
import { orderBy } from 'lodash';
import { SetGoalDialog } from '../../shared-components/goals/set-goal-dialog';
import { MyProgressDialog } from './my-progress-dialog';
import { DispatchContext, StoreContext } from '../../reducers/store.provider';
import { isMobile } from 'react-device-detect';

export const LegendaryEvent = ({ legendaryEvent }: { legendaryEvent: ILegendaryEvent }) => {
    const { characters, viewPreferences, selectedTeamOrder, leSelectedTeams, leProgress } = useContext(StoreContext);
    const dispatch = useContext(DispatchContext);

    const selectChars =
        (section: LegendaryEventSection) =>
        (team: string, ...chars: string[]) => {
            dispatch.leSelectedTeams({ type: 'SelectChars', eventId: legendaryEvent.id, section, chars, team });
            enqueueSnackbar(`${chars.join(',')} added to ${team} of ${section} sector`, { variant: 'success' });
        };

    const deselectChars =
        (section: LegendaryEventSection) =>
        (team: string, ...chars: string[]) => {
            dispatch.leSelectedTeams({ type: 'DeselectChars', eventId: legendaryEvent.id, section, chars, team });
            enqueueSnackbar(`${chars.join(',')} removed from ${team} of ${section} sector`, { variant: 'warning' });
        };

    function getSelectedChars(selectedTeams: SelectedTeams) {
        const result: Record<string, Array<ICharacter2 | string>> = {};
        for (const teamKey in selectedTeams) {
            const team = selectedTeams[teamKey].map(charName => characters.find(x => x.name === charName) ?? '');
            result[teamKey] = orderBy(team, selectedTeamOrder.orderBy, selectedTeamOrder.direction);
        }
        return result;
    }

    const alphaSelectedChars = useMemo(() => {
        const selectedTeams = leSelectedTeams[legendaryEvent.id]?.alpha ?? {};
        return getSelectedChars(selectedTeams);
    }, [leSelectedTeams[legendaryEvent.id]?.alpha, selectedTeamOrder]);

    const betaSelectedChars = useMemo(() => {
        const selectedTeams = leSelectedTeams[legendaryEvent.id]?.beta ?? {};
        return getSelectedChars(selectedTeams);
    }, [leSelectedTeams[legendaryEvent.id]?.beta, selectedTeamOrder]);

    const gammaSelectedChars = useMemo(() => {
        const selectedTeams = leSelectedTeams[legendaryEvent.id]?.gamma ?? {};
        return getSelectedChars(selectedTeams);
    }, [leSelectedTeams[legendaryEvent.id]?.gamma, selectedTeamOrder]);

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
                <div style={{ display: 'flex' }}>
                    <span>Selected teams</span>
                    <Tooltip title={'Click - removes single char, Shift + Click - remove whole team'}>
                        <Info />
                    </Tooltip>
                </div>
                <div
                    style={{ display: 'flex', flexWrap: isMobile ? 'wrap' : 'nowrap', gap: 15, overflow: 'auto' }}
                    key={legendaryEvent.id}>
                    <SelectedTeamsTable
                        show={viewPreferences.showAlpha}
                        track={legendaryEvent.alpha}
                        teams={alphaSelectedChars}
                        deselectChars={deselectChars('alpha')}
                        completedRequirements={viewPreferences.hideCompleted ? alphaCompletedRequirements : []}
                    />
                    <SelectedTeamsTable
                        show={viewPreferences.showBeta}
                        track={legendaryEvent.beta}
                        teams={betaSelectedChars}
                        deselectChars={deselectChars('beta')}
                        completedRequirements={viewPreferences.hideCompleted ? betaCompletedRequirements : []}
                    />
                    <SelectedTeamsTable
                        show={viewPreferences.showGamma}
                        track={legendaryEvent.gamma}
                        teams={gammaSelectedChars}
                        deselectChars={deselectChars('gamma')}
                        completedRequirements={viewPreferences.hideCompleted ? gammaCompletedRequirements : []}
                    />
                </div>
            </div>
        </div>
    );
};
