import { useState } from 'react';

import { RosterSnapshotShowVariableSettings } from '@/fsd/3-features/view-settings';

import { RosterSnapshotsUnit } from '@/fsd/2-widgets/roster-snapshots-unit';

import { MemberState } from './guild-roster-snapshots.models';

const SHOW_ALL = RosterSnapshotShowVariableSettings.Always;

interface RostersTabProps {
    members: string[] | undefined;
    memberStates: Map<string, MemberState>;
}

export const RostersTab = ({ members, memberStates }: RostersTabProps) => {
    const [selectedId, setSelectedId] = useState<string | undefined>();

    if (members === undefined) {
        return (
            <p className="text-sm text-gray-500 dark:text-gray-400">Click &ldquo;Load Members&rdquo; to get started.</p>
        );
    }

    const notShared = members.filter(id => memberStates.get(id)?.status === 'not-shared');
    const nameOnly = members.filter(id => memberStates.get(id)?.status === 'name-only');
    const successes = members.filter(id => memberStates.get(id)?.status === 'success');
    const loadingCount = members.filter(id => memberStates.get(id)?.status === 'loading').length;

    const selectedState = selectedId ? memberStates.get(selectedId) : undefined;
    const selectedRoster = selectedState?.status === 'success' ? selectedState : undefined;

    return (
        <div className="flex flex-col gap-6">
            {loadingCount > 0 && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    Loaded {members.length - loadingCount} / {members.length}…
                </p>
            )}

            {members.length === 0 && <p className="text-sm text-gray-500 dark:text-gray-400">No members found.</p>}

            {notShared.length > 0 && (
                <section className="flex flex-col gap-2">
                    <h2 className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                        Not sharing anything ({notShared.length})
                    </h2>
                    <ul className="flex flex-wrap gap-2">
                        {notShared.map(id => (
                            <li key={id} className="rounded bg-gray-100 px-2 py-0.5 font-mono text-xs dark:bg-gray-800">
                                {id}
                            </li>
                        ))}
                    </ul>
                </section>
            )}

            {nameOnly.length > 0 && (
                <section className="flex flex-col gap-2">
                    <h2 className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                        Not sharing roster ({nameOnly.length})
                    </h2>
                    <ul className="flex flex-wrap gap-2">
                        {nameOnly.map(id => {
                            const state = memberStates.get(id);
                            const name = state?.status === 'name-only' ? state.playerName : id;
                            return (
                                <li key={id} className="rounded bg-gray-100 px-2 py-0.5 text-xs dark:bg-gray-800">
                                    {name}
                                </li>
                            );
                        })}
                    </ul>
                </section>
            )}

            {successes.length > 0 && (
                <section className="flex flex-col gap-4">
                    <div className="flex items-center gap-2">
                        <label
                            htmlFor="roster-select"
                            className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                            View roster:
                        </label>
                        <select
                            id="roster-select"
                            value={selectedId ?? ''}
                            onChange={event_ => setSelectedId(event_.target.value || undefined)}
                            className="rounded border border-gray-300 bg-white px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100">
                            <option value="">— select a player —</option>
                            {successes.map(id => {
                                const state = memberStates.get(id);
                                const name = state?.status === 'success' ? state.playerName : id;
                                return (
                                    <option key={id} value={id}>
                                        {name}
                                    </option>
                                );
                            })}
                        </select>
                    </div>

                    {selectedRoster && (
                        <div className="flex flex-wrap gap-2">
                            {selectedRoster.parsed.units.map(({ char, mow }) =>
                                char ? (
                                    <RosterSnapshotsUnit
                                        key={char.id}
                                        char={char}
                                        showShards={SHOW_ALL}
                                        showMythicShards={SHOW_ALL}
                                        showXpLevel={SHOW_ALL}
                                        showAbilities={SHOW_ALL}
                                        showEquipment={SHOW_ALL}
                                        showTooltip
                                        isEnabled
                                    />
                                ) : mow ? (
                                    <RosterSnapshotsUnit
                                        key={mow.id}
                                        mow={mow}
                                        showShards={SHOW_ALL}
                                        showMythicShards={SHOW_ALL}
                                        showXpLevel={SHOW_ALL}
                                        showAbilities={SHOW_ALL}
                                        showEquipment={SHOW_ALL}
                                        showTooltip
                                        isEnabled
                                    />
                                ) : undefined
                            )}
                        </div>
                    )}
                </section>
            )}
        </div>
    );
};
