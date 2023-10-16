import React, { useContext, useMemo } from 'react';

import { ICharacter2, LegendaryEventSection, SelectedTeams } from '../../models/interfaces';
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
import { LegendaryEventEnum } from '../../models/enums';
import { getLegendaryEvent } from '../../models/constants';

const LegendaryEvent = ({ id }: { id: LegendaryEventEnum }) => {
    const { characters, viewPreferences, selectedTeamOrder, leSelectedTeams } = useContext(StoreContext);
    const dispatch = useContext(DispatchContext);
    const legendaryEvent = useMemo(() => getLegendaryEvent(id, characters), [id]);

    const selectChars =
        (section: LegendaryEventSection) =>
        (team: string, ...chars: string[]) => {
            dispatch.leSelectedTeams({ type: 'SelectChars', eventId: legendaryEvent.id, section, chars, team });
        };

    const deselectChars =
        (section: LegendaryEventSection) =>
        (team: string, ...chars: string[]) => {
            dispatch.leSelectedTeams({ type: 'DeselectChars', eventId: legendaryEvent.id, section, chars, team });
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

    return (
        <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 15, marginBottom: 10 }}>
                    <div style={{ display: 'flex' }}>
                        <span>Recommended teams</span>
                        <Tooltip title={'Click - adds single char, Shift + Click - adds top 5 chars'}>
                            <Info />
                        </Tooltip>
                    </div>

                    <FormControl
                        sx={{ width: 200 }}
                        size={'small'}
                        disabled={viewPreferences.hideSelectedTeams && viewPreferences.autoTeams}>
                        <InputLabel id="order-by-label">Order By</InputLabel>
                        <Select
                            labelId="order-by-label"
                            id="order-by"
                            value={selectedTeamOrder.orderBy}
                            label="Order By"
                            onChange={event => {
                                const value = event.target.value as any;
                                dispatch.selectedTeamOrder({ type: 'UpdateOrder', value });
                            }}>
                            <MenuItem value={'name'}>Name</MenuItem>
                            <MenuItem value={'rarity'}>Rarity</MenuItem>
                            <MenuItem value={'rank'}>Rank</MenuItem>
                        </Select>
                    </FormControl>

                    <FormControl
                        sx={{ width: 200 }}
                        size={'small'}
                        disabled={viewPreferences.hideSelectedTeams && viewPreferences.autoTeams}>
                        <InputLabel id="direction-label">Direction</InputLabel>
                        <Select
                            labelId="direction-label"
                            id="direction"
                            value={selectedTeamOrder.direction}
                            label="Direction"
                            onChange={event => {
                                const value = event.target.value as any;
                                dispatch.selectedTeamOrder({ type: 'UpdateDirection', value });
                            }}>
                            <MenuItem value={'asc'}>Ascending</MenuItem>
                            <MenuItem value={'desc'}>Descending</MenuItem>
                        </Select>
                    </FormControl>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <SetGoalDialog />
                    <MyProgressDialog legendaryEvent={legendaryEvent} />
                    <DataTablesDialog legendaryEvent={legendaryEvent} />
                </div>
            </div>
            <div style={{ display: 'flex', gap: 15, marginBottom: 10 }} key={legendaryEvent.id}>
                <LegendaryEventTrack
                    show={viewPreferences.showAlpha}
                    track={legendaryEvent.alpha}
                    selectChars={selectChars('alpha')}
                />
                <LegendaryEventTrack
                    show={viewPreferences.showBeta}
                    track={legendaryEvent.beta}
                    selectChars={selectChars('beta')}
                />
                <LegendaryEventTrack
                    show={viewPreferences.showGamma}
                    track={legendaryEvent.gamma}
                    selectChars={selectChars('gamma')}
                />
            </div>
            <div style={{ display: viewPreferences.hideSelectedTeams ? 'none' : 'block' }}>
                <div style={{ display: 'flex' }}>
                    <span>Selected teams</span>
                    <Tooltip title={'Click - removes single char, Shift + Click - remove whole team'}>
                        <Info />
                    </Tooltip>
                </div>
                <div style={{ display: 'flex', gap: 15 }} key={legendaryEvent.id}>
                    <SelectedTeamsTable
                        show={viewPreferences.showAlpha}
                        track={legendaryEvent.alpha}
                        teams={alphaSelectedChars}
                        deselectChars={deselectChars('alpha')}
                    />
                    <SelectedTeamsTable
                        show={viewPreferences.showBeta}
                        track={legendaryEvent.beta}
                        teams={betaSelectedChars}
                        deselectChars={deselectChars('beta')}
                    />
                    <SelectedTeamsTable
                        show={viewPreferences.showGamma}
                        track={legendaryEvent.gamma}
                        teams={gammaSelectedChars}
                        deselectChars={deselectChars('gamma')}
                    />
                </div>
            </div>
        </div>
    );
};

export default LegendaryEvent;
