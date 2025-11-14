import { useContext, useMemo, useState } from 'react';
import { isMobile } from 'react-device-detect';

// eslint-disable-next-line import-x/no-internal-modules
import { DispatchContext, StoreContext } from '@/reducers/store.provider';

import { CharactersService, ICharacter2 } from '@/fsd/4-entities/character';
import { LreTrackId } from '@/fsd/4-entities/lre';

import { ILegendaryEvent, ILreTeam } from '@/fsd/3-features/lre';

import { useLreProgress } from './le-progress.hooks';
import { LegendaryEventTrack } from './legendary-event-track';
import { LreAddTeam } from './lre-add-team';
import { LreEditTeam } from './lre-edit-team';
import { LreService } from './lre.service';

export const LegendaryEvent = ({ legendaryEvent }: { legendaryEvent: ILegendaryEvent }) => {
    const { viewPreferences, leSelectedTeams, characters } = useContext(StoreContext);
    const dispatch = useContext(DispatchContext);
    const { model: lreProgress } = useLreProgress(legendaryEvent);

    const [showAddTeam, setShowAddTeam] = useState(false);
    const [editTeam, setEditTeam] = useState<ILreTeam | null>(null);
    const [preselectedTrackId, setPreselectedTrackId] = useState<LreTrackId>('alpha');
    const [preselectedRequirements, setPreselectedRequirements] = useState<string[]>([]);

    const resolvedCharacters = useMemo(() => CharactersService.resolveStoredCharacters(characters), [characters]);

    // Compute virtual attributes (not saved in JSON) for display on LRE team cards.
    const selectedTeams = (leSelectedTeams[legendaryEvent.id]?.teams ?? []).map(rawTeam => {
        const team = { ...rawTeam };
        team.points = 0;
        for (const id of team.restrictionsIds) {
            team.points += legendaryEvent[team.section].getRestrictionPoints(id);
        }

        // Old team pre mythic, need to convert it.
        if (
            team.charactersIds !== undefined &&
            team.charactersIds.length > 0 &&
            (team.charSnowprintIds === undefined || team.charSnowprintIds.length === 0)
        ) {
            team.charSnowprintIds = team.charactersIds.map(
                oldId =>
                    CharactersService.resolveCharacter(CharactersService.canonicalName(oldId))?.snowprintId ?? oldId
            );
            team.charactersIds = [];
        }

        team.characters = (team.charSnowprintIds ?? team.charactersIds ?? []).map(id => {
            const character = resolvedCharacters.find(x => x.snowprintId === id);
            if (!character) {
                console.warn(
                    'unknown character. if you have imported goals from a pre-mythic ',
                    'instance of the planner, please remove the unit and add it back.',
                    id,
                    id,
                    character
                );
            }

            return { ...character, teamId: team.id };
        }) as ICharacter2[];
        return team;
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
                charactersIds: team.map(x => x.name),
                charSnowprintIds: team.map(x => x.snowprintId!),
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
            charSnowprintIds: team.charSnowprintIds ?? [],
            expectedBattleClears: team.expectedBattleClears,
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
            <div style={{ display: 'flex', flexWrap: isMobile ? 'wrap' : 'nowrap', gap: 15, marginBottom: 10 }}>
                {viewPreferences.showAlpha && (
                    <LegendaryEventTrack
                        legendaryEvent={legendaryEvent}
                        track={legendaryEvent.alpha}
                        startAddTeam={startAddTeam}
                        editTeam={setEditTeam}
                        autoAddTeam={autoAddTeam}
                        deleteTeam={deleteTeam}
                        teams={selectedTeams.filter(x => x.section === 'alpha')}
                        progress={LreService.getReqProgressPerTrack(
                            lreProgress.tracksProgress.find(x => x.trackId == 'alpha')!
                        )}
                    />
                )}
                {viewPreferences.showBeta && (
                    <LegendaryEventTrack
                        legendaryEvent={legendaryEvent}
                        track={legendaryEvent.beta}
                        startAddTeam={startAddTeam}
                        editTeam={setEditTeam}
                        autoAddTeam={autoAddTeam}
                        deleteTeam={deleteTeam}
                        teams={selectedTeams.filter(x => x.section === 'beta')}
                        progress={LreService.getReqProgressPerTrack(
                            lreProgress.tracksProgress.find(x => x.trackId == 'beta')!
                        )}
                    />
                )}
                {viewPreferences.showGamma && (
                    <LegendaryEventTrack
                        legendaryEvent={legendaryEvent}
                        track={legendaryEvent.gamma}
                        startAddTeam={startAddTeam}
                        editTeam={setEditTeam}
                        autoAddTeam={autoAddTeam}
                        deleteTeam={deleteTeam}
                        teams={selectedTeams.filter(x => x.section === 'gamma')}
                        progress={LreService.getReqProgressPerTrack(
                            lreProgress.tracksProgress.find(x => x.trackId == 'gamma')!
                        )}
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
