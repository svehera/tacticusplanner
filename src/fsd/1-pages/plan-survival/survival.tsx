/* eslint-disable import-x/no-internal-modules */
import { useContext, useMemo, useState } from 'react';

import { DispatchContext, StoreContext } from '@/reducers/store.provider';

import { Select } from '@/fsd/5-shared/ui/selects';
import { UnitPortraitAssetsProvider } from '@/fsd/5-shared/ui/unit-portrait';

import { CharactersService } from '@/fsd/4-entities/character';
import { MowsService } from '@/fsd/4-entities/mow';
import {
    getSurvivalDisplayIconUrl,
    getSurvivalDisplayName,
    ISurvivalEvent,
    survivalEvents,
} from '@/fsd/4-entities/survival';

import { EnemiesTab } from './tabs/enemies-tab';
import { MilestonesTab } from './tabs/milestones-tab';
import { MissionsTab } from './tabs/missions-tab';
import { OffersTab } from './tabs/offers-tab';
import { TeamTab } from './tabs/team-tab';

const TAB_IDS = ['team', 'enemies', 'milestones', 'missions', 'offers'] as const;
type TabId = (typeof TAB_IDS)[number];

const TAB_LABELS: Record<TabId, string> = {
    team: 'Team',
    enemies: 'Enemies',
    milestones: 'Milestones & Rewards',
    missions: 'Missions',
    offers: 'Offers',
};

const TabBar = ({ active, onChange }: { active: TabId; onChange: (tab: TabId) => void }) => (
    <div className="flex gap-1 border-b border-gray-200 dark:border-gray-700">
        {TAB_IDS.map(id => (
            <button
                key={id}
                type="button"
                onClick={() => onChange(id)}
                className={[
                    'px-4 py-2 text-sm font-medium transition-colors',
                    active === id
                        ? 'border-b-2 border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                        : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100',
                ].join(' ')}>
                {TAB_LABELS[id]}
            </button>
        ))}
    </div>
);

export const Survival = () => {
    const { characters: unresolvedCharacters, mows: unresolvedMows, survivalTeams, goals } = useContext(StoreContext);
    const dispatch = useContext(DispatchContext);

    const characters = useMemo(
        () => CharactersService.resolveStoredCharacters(unresolvedCharacters),
        [unresolvedCharacters]
    );
    const mows = useMemo(() => MowsService.resolveAllFromStorage(unresolvedMows), [unresolvedMows]);

    const sortedEvents = useMemo(
        () => survivalEvents.toSorted((a, b) => getSurvivalDisplayName(a).localeCompare(getSurvivalDisplayName(b))),
        []
    );

    const [selectedEventName, setSelectedEventName] = useState(sortedEvents[0]?.eventName ?? '');
    const selectedEvent = useMemo(
        () => survivalEvents.find(event => event.eventName === selectedEventName),
        [selectedEventName]
    );

    const [activeTab, setActiveTab] = useState<TabId>('team');

    if (!selectedEvent) {
        return <div className="p-4 text-(--soft-fg)">No survival events available.</div>;
    }

    const teamUnitIds = survivalTeams[selectedEvent.eventName] ?? [];
    const setTeamUnitIds = (unitIds: string[]) => {
        dispatch.survivalTeams({ type: 'SetTeam', eventId: selectedEvent.eventName, unitIds });
    };

    return (
        <UnitPortraitAssetsProvider>
            <div className="flex flex-col gap-6 p-4">
                <div className="flex flex-wrap items-end gap-4 rounded-xl border border-(--border) bg-(--overlay) p-4">
                    <Select<ISurvivalEvent>
                        label="Survival"
                        options={sortedEvents}
                        value={selectedEvent}
                        by={(a, z) => a.eventName === z.eventName}
                        onChange={event => setSelectedEventName(event.eventName)}
                        renderOption={event => (
                            <div className="flex items-center gap-2">
                                <img
                                    src={getSurvivalDisplayIconUrl(event)}
                                    className="size-6 rounded-full object-cover"
                                />
                                <span>{getSurvivalDisplayName(event)}</span>
                            </div>
                        )}
                    />
                </div>

                <TabBar active={activeTab} onChange={setActiveTab} />

                <div className={activeTab === 'team' ? undefined : 'hidden'}>
                    <TeamTab
                        event={selectedEvent}
                        characters={characters}
                        mows={mows}
                        teamUnitIds={teamUnitIds}
                        onTeamChange={setTeamUnitIds}
                        goals={goals}
                    />
                </div>
                <div className={activeTab === 'enemies' ? undefined : 'hidden'}>
                    <EnemiesTab event={selectedEvent} />
                </div>
                <div className={activeTab === 'milestones' ? undefined : 'hidden'}>
                    <MilestonesTab event={selectedEvent} />
                </div>
                <div className={activeTab === 'missions' ? undefined : 'hidden'}>
                    <MissionsTab event={selectedEvent} />
                </div>
                <div className={activeTab === 'offers' ? undefined : 'hidden'}>
                    <OffersTab event={selectedEvent} />
                </div>
            </div>
        </UnitPortraitAssetsProvider>
    );
};
