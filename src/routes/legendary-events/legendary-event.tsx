import React, { useContext, useMemo, useState } from 'react';

import { ICharacter2, ILegendaryEvent, ILreTeam, LreTrackId } from 'src/models/interfaces';
import { LegendaryEventTrack } from './legendary-event-track';

import { DispatchContext, StoreContext } from 'src/reducers/store.provider';
import { isMobile } from 'react-device-detect';
import { LreAddTeam } from 'src/v2/features/lre/lre-add-team';
import { LreEditTeam } from 'src/v2/features/lre/lre-edit-team';

export const LegendaryEvent = ({ legendaryEvent }: { legendaryEvent: ILegendaryEvent }) => {
    const { characters, viewPreferences, leSelectedTeams, leProgress } = useContext(StoreContext);
    const dispatch = useContext(DispatchContext);

    const [showAddTeam, setShowAddTeam] = useState(false);
    const [editTeam, setEditTeam] = useState<ILreTeam | null>(null);
    const [preselectedTrackId, setPreselectedTrackId] = useState<LreTrackId>('alpha');
    const [preselectedRequirements, setPreselectedRequirements] = useState<string[]>([]);

    const selectedTeams: ILreTeam[] = leSelectedTeams[legendaryEvent.id]?.teams ?? [];

    selectedTeams.forEach(team => {
        team.characters = team.charactersIds.map(id => {
            const character = characters.find(x => x.id === id);

            return { ...character, teamId: team.id };
        }) as ICharacter2[];
    });

    const startAddTeam = (section: LreTrackId, restrictions: string[]) => {
        setShowAddTeam(true);
        setPreselectedTrackId(section);
        setPreselectedRequirements(restrictions);
    };

    const getCompletedRequirements = (section: LreTrackId): string[] => {
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

    const addLreTeam = (team: ILreTeam) => {
        dispatch.leSelectedTeams({ type: 'AddTeam', eventId: legendaryEvent.id, team });
        setShowAddTeam(false);
    };

    const saveLreTeam = (team: ILreTeam) => {
        dispatch.leSelectedTeams({
            type: 'UpdateTeam',
            eventId: legendaryEvent.id,
            teamId: team.id,
            name: team.name,
            charactersIds: team.charactersIds,
        });
        setEditTeam(null);
    };

    const deleteTeam = (teamId: string) => {
        if (confirm('Are you sure you want to delete?')) {
            dispatch.leSelectedTeams({
                type: 'DeleteTeam',
                eventId: legendaryEvent.id,
                teamId,
            });
            setEditTeam(null);
        }
    };

    return (
        <div>
            <div
                style={{ display: 'flex', flexWrap: isMobile ? 'wrap' : 'nowrap', gap: 15, marginBottom: 10 }}
                key={legendaryEvent.id}>
                {viewPreferences.showAlpha && (
                    <LegendaryEventTrack
                        track={legendaryEvent.alpha}
                        startAddTeam={startAddTeam}
                        editTeam={setEditTeam}
                        teams={selectedTeams.filter(x => x.section === 'alpha')}
                        completedRequirements={viewPreferences.hideCompleted ? alphaCompletedRequirements : []}
                    />
                )}
                {viewPreferences.showBeta && (
                    <LegendaryEventTrack
                        track={legendaryEvent.beta}
                        startAddTeam={startAddTeam}
                        editTeam={setEditTeam}
                        teams={selectedTeams.filter(x => x.section === 'beta')}
                        completedRequirements={viewPreferences.hideCompleted ? betaCompletedRequirements : []}
                    />
                )}
                {viewPreferences.showGamma && (
                    <LegendaryEventTrack
                        track={legendaryEvent.gamma}
                        startAddTeam={startAddTeam}
                        editTeam={setEditTeam}
                        teams={selectedTeams.filter(x => x.section === 'gamma')}
                        completedRequirements={viewPreferences.hideCompleted ? gammaCompletedRequirements : []}
                    />
                )}
            </div>
            {showAddTeam && (
                <LreAddTeam
                    lre={legendaryEvent}
                    preselectedTrackId={preselectedTrackId}
                    preselectedRequirements={preselectedRequirements}
                    onClose={() => setShowAddTeam(false)}
                    addTeam={addLreTeam}
                />
            )}
            {editTeam && (
                <LreEditTeam
                    lre={legendaryEvent}
                    team={editTeam}
                    onClose={() => setEditTeam(null)}
                    saveTeam={saveLreTeam}
                    deleteTeam={deleteTeam}
                />
            )}
        </div>
    );
};
