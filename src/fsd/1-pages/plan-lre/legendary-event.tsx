import { useCallback, useContext, useEffect, useState } from 'react';
import { isMobile } from 'react-device-detect';

// eslint-disable-next-line import-x/no-internal-modules
import { DispatchContext, StoreContext } from '@/reducers/store.provider';

import { CharactersService, ICharacter2 } from '@/fsd/4-entities/character';
import { LegendaryEventEnum, LreTrackId } from '@/fsd/4-entities/lre';

// eslint-disable-next-line import-x/no-internal-modules
import { ICharacterUpgradeMow, ICharacterUpgradeRankGoal } from '@/fsd/3-features/goals/goals.models';
import { ILegendaryEvent, ILegendaryEventSelectedRequirements, ILreTeam } from '@/fsd/3-features/lre';

import { useLreProgress } from './le-progress.hooks';
import { LegendaryEventTrack } from './legendary-event-track';
import { LreAddTeam } from './lre-add-team';
import { LreEditTeam } from './lre-edit-team';
import { ILreSectionVisibilitySettings } from './lre-sections-settings';
import { LreService } from './lre.service';

const leSelectedRequirementsStorageKey = 'tp-leSelectedRequirements';

type LreSelectedRequirementsByEvent = Partial<Record<LegendaryEventEnum, ILegendaryEventSelectedRequirements>>;

const createDefaultSelectedRequirements = (eventId: LegendaryEventEnum): ILegendaryEventSelectedRequirements => ({
    id: eventId,
    name: LegendaryEventEnum[eventId],
    alpha: {},
    beta: {},
    gamma: {},
});

const loadSelectedRequirementsFromLocalStorage = (): LreSelectedRequirementsByEvent => {
    const raw = localStorage.getItem(leSelectedRequirementsStorageKey);

    if (!raw) {
        return {};
    }

    try {
        const parsed = JSON.parse(raw) as LreSelectedRequirementsByEvent;
        return parsed ?? {};
    } catch {
        return {};
    }
};

export const LegendaryEvent = ({
    legendaryEvent,
    upgradeRankOrMowGoals,
    sectionVisibility,
}: {
    legendaryEvent: ILegendaryEvent;
    upgradeRankOrMowGoals: (ICharacterUpgradeRankGoal | ICharacterUpgradeMow)[];
    sectionVisibility: ILreSectionVisibilitySettings;
}) => {
    const { leSelectedTeams } = useContext(StoreContext);
    const dispatch = useContext(DispatchContext);
    const { model: lreProgress } = useLreProgress(legendaryEvent);

    const [showAddTeam, setShowAddTeam] = useState(false);
    const [editTeam, setEditTeam] = useState<ILreTeam>();
    const [preselectedTrackId, setPreselectedTrackId] = useState<LreTrackId>('alpha');
    const [preselectedRequirements, setPreselectedRequirements] = useState<string[]>([]);
    const [selectedRequirementsByEvent, setSelectedRequirementsByEvent] = useState<LreSelectedRequirementsByEvent>(
        loadSelectedRequirementsFromLocalStorage
    );

    useEffect(() => {
        localStorage.setItem(leSelectedRequirementsStorageKey, JSON.stringify(selectedRequirementsByEvent));
    }, [selectedRequirementsByEvent]);

    const updateRestrictionSelection = useCallback(
        (eventId: LegendaryEventEnum, section: LreTrackId, restrictionName: string, selected: boolean) => {
            setSelectedRequirementsByEvent(current => {
                const eventRequirements = current[eventId] ?? createDefaultSelectedRequirements(eventId);

                return {
                    ...current,
                    [eventId]: {
                        ...eventRequirements,
                        [section]: {
                            ...eventRequirements[section],
                            [restrictionName]: selected,
                        },
                    },
                };
            });
        },
        []
    );

    const clearSectionSelection = useCallback((eventId: LegendaryEventEnum, section: LreTrackId) => {
        setSelectedRequirementsByEvent(current => {
            const eventRequirements = current[eventId] ?? createDefaultSelectedRequirements(eventId);
            const currentSection = eventRequirements[section];
            const clearedSection = Object.fromEntries(Object.keys(currentSection).map(key => [key, false]));

            return {
                ...current,
                [eventId]: {
                    ...eventRequirements,
                    [section]: clearedSection,
                },
            };
        });
    }, []);

    // Compute virtual attributes (not saved in JSON) for display on LRE team cards.
    const selectedTeams = (leSelectedTeams[legendaryEvent.id]?.teams ?? []).map(rawTeam => {
        const team = { ...rawTeam, points: 0 };
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
                charSnowprintIds: team.map(x => x.snowprintId),
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
        setEditTeam(undefined);
    };

    const deleteTeam = (teamId: string) => {
        if (confirm('Are you sure you want to delete?')) {
            dispatch.leSelectedTeams({
                type: 'DeleteTeam',
                eventId: legendaryEvent.id,
                teamId,
            });
            setEditTeam(undefined);
        }
    };

    return (
        <div>
            <div className="mb-2.5 flex gap-[15px]" style={{ flexWrap: isMobile ? 'wrap' : 'nowrap' }}>
                {sectionVisibility.showAlpha && (
                    <LegendaryEventTrack
                        legendaryEvent={legendaryEvent}
                        track={legendaryEvent.alpha}
                        upgradeRankOrMowGoals={upgradeRankOrMowGoals}
                        startAddTeam={startAddTeam}
                        editTeam={setEditTeam}
                        autoAddTeam={autoAddTeam}
                        deleteTeam={deleteTeam}
                        teams={selectedTeams.filter(x => x.section === 'alpha')}
                        progress={LreService.getReqProgressPerTrack(
                            lreProgress.tracksProgress.find(x => x.trackId == 'alpha')!
                        )}
                        selectedRequirementsSection={selectedRequirementsByEvent[legendaryEvent.id]?.alpha ?? {}}
                        updateRestrictionSelection={updateRestrictionSelection}
                        clearSectionSelection={clearSectionSelection}
                    />
                )}
                {sectionVisibility.showBeta && (
                    <LegendaryEventTrack
                        legendaryEvent={legendaryEvent}
                        track={legendaryEvent.beta}
                        upgradeRankOrMowGoals={upgradeRankOrMowGoals}
                        startAddTeam={startAddTeam}
                        editTeam={setEditTeam}
                        autoAddTeam={autoAddTeam}
                        deleteTeam={deleteTeam}
                        teams={selectedTeams.filter(x => x.section === 'beta')}
                        progress={LreService.getReqProgressPerTrack(
                            lreProgress.tracksProgress.find(x => x.trackId == 'beta')!
                        )}
                        selectedRequirementsSection={selectedRequirementsByEvent[legendaryEvent.id]?.beta ?? {}}
                        updateRestrictionSelection={updateRestrictionSelection}
                        clearSectionSelection={clearSectionSelection}
                    />
                )}
                {sectionVisibility.showGamma && (
                    <LegendaryEventTrack
                        legendaryEvent={legendaryEvent}
                        track={legendaryEvent.gamma}
                        upgradeRankOrMowGoals={upgradeRankOrMowGoals}
                        startAddTeam={startAddTeam}
                        editTeam={setEditTeam}
                        autoAddTeam={autoAddTeam}
                        deleteTeam={deleteTeam}
                        teams={selectedTeams.filter(x => x.section === 'gamma')}
                        progress={LreService.getReqProgressPerTrack(
                            lreProgress.tracksProgress.find(x => x.trackId == 'gamma')!
                        )}
                        selectedRequirementsSection={selectedRequirementsByEvent[legendaryEvent.id]?.gamma ?? {}}
                        updateRestrictionSelection={updateRestrictionSelection}
                        clearSectionSelection={clearSectionSelection}
                    />
                )}
            </div>
            {showAddTeam && (
                <LreAddTeam
                    lre={legendaryEvent}
                    preselectedTrackId={preselectedTrackId}
                    preselectedRequirements={preselectedRequirements}
                    upgradeRankOrMowGoals={upgradeRankOrMowGoals}
                    onClose={() => setShowAddTeam(false)}
                    addTeam={addLreTeam}
                />
            )}
            {editTeam && (
                <LreEditTeam
                    lre={legendaryEvent}
                    team={editTeam}
                    upgradeRankOrMowGoals={upgradeRankOrMowGoals}
                    onClose={() => setEditTeam(undefined)}
                    saveTeam={saveLreTeam}
                    deleteTeam={deleteTeam}
                />
            )}
        </div>
    );
};
