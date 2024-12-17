import React, { useContext, useMemo, useState } from 'react';

import { ICharacter2, ILegendaryEvent, ILreTeam, LreTrackId } from 'src/models/interfaces';
import { LegendaryEventTrack } from './legendary-event-track';

import { DispatchContext, StoreContext } from 'src/reducers/store.provider';
import { isMobile } from 'react-device-detect';
import { LreAddTeam } from 'src/v2/features/lre/lre-add-team';
import { LreEditTeam } from 'src/v2/features/lre/lre-edit-team';
import { useLreProgress } from 'src/shared-components/le-progress.hooks';
import { ILreTrackProgress } from 'src/v2/features/lre/lre.models';

export const LegendaryEvent = ({ legendaryEvent }: { legendaryEvent: ILegendaryEvent }) => {
    const { characters, viewPreferences, leSelectedTeams } = useContext(StoreContext);
    const dispatch = useContext(DispatchContext);
    const { model: lreProgress } = useLreProgress(legendaryEvent);

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

    const autoAddTeam = (section: LreTrackId, restrictions: string[], team: ICharacter2[]) => {
        dispatch.leSelectedTeams({
            type: 'AddTeam',
            eventId: legendaryEvent.id,
            team: {
                id: '',
                name: section,
                section: section,
                charactersIds: team.map(x => x.id),
                restrictionsIds: restrictions,
            },
        });
    };

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

    const getReqProgressPerTrack = (trackProgress: ILreTrackProgress) => {
        const completedReqs = trackProgress.battles.flatMap(x => x.requirementsProgress).filter(x => x.completed);
        const result: Record<string, number> = {};

        trackProgress.requirements.forEach(requirement => {
            result[requirement.id] = completedReqs.filter(x => x.id === requirement.id).length;
        });

        return result;
    };

    return (
        <div>
            <div style={{ display: 'flex', flexWrap: isMobile ? 'wrap' : 'nowrap', gap: 15, marginBottom: 10 }}>
                {viewPreferences.showAlpha && (
                    <LegendaryEventTrack
                        track={legendaryEvent.alpha}
                        startAddTeam={startAddTeam}
                        editTeam={setEditTeam}
                        autoAddTeam={autoAddTeam}
                        deleteTeam={deleteTeam}
                        teams={selectedTeams.filter(x => x.section === 'alpha')}
                        progress={getReqProgressPerTrack(lreProgress.tracksProgress.find(x => x.trackId == 'alpha')!)}
                    />
                )}
                {viewPreferences.showBeta && (
                    <LegendaryEventTrack
                        track={legendaryEvent.beta}
                        startAddTeam={startAddTeam}
                        editTeam={setEditTeam}
                        autoAddTeam={autoAddTeam}
                        deleteTeam={deleteTeam}
                        teams={selectedTeams.filter(x => x.section === 'beta')}
                        progress={getReqProgressPerTrack(lreProgress.tracksProgress.find(x => x.trackId == 'beta')!)}
                    />
                )}
                {viewPreferences.showGamma && (
                    <LegendaryEventTrack
                        track={legendaryEvent.gamma}
                        startAddTeam={startAddTeam}
                        editTeam={setEditTeam}
                        autoAddTeam={autoAddTeam}
                        deleteTeam={deleteTeam}
                        teams={selectedTeams.filter(x => x.section === 'gamma')}
                        progress={getReqProgressPerTrack(lreProgress.tracksProgress.find(x => x.trackId == 'gamma')!)}
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
