import { Tab, Tabs } from '@mui/material';
import { useEffect, useRef, useState } from 'react';

import { useAuth } from '@/fsd/5-shared/model';
import { Button, DebugJson } from '@/fsd/5-shared/ui';
import { UnitPortraitAssetsProvider } from '@/fsd/5-shared/ui/unit-portrait';

import { parseErrorState, parseUnits } from './guild-roster-snapshots.helpers';
import { getGuildMemberRosterApi, getGuildMembersApi, GuildTab, MemberState } from './guild-roster-snapshots.models';
import { MembersTab } from './members-tab';
import { RosterSnapshotsTab } from './roster-snapshots-tab';
import { RostersTab } from './rosters-tab';
import { SharedLeaderboardsTab } from './shared-leaderboards-tab';

// Module-level cache — persists across navigations within a session
let cachedMembers: string[] | undefined;
let cachedMemberStates: Map<string, MemberState> = new Map();
let cachedHasLoadedOnce = false;

const NoKeyMessage = () => (
    <div className="flex flex-col items-center justify-center px-8 py-16 text-center">
        <p className="max-w-prose text-base">
            This page is only available to guild leaders. If you are a guild leader, please obtain a guild API key from{' '}
            <a
                href="https://api.tacticusgame.com"
                target="_blank"
                rel="noreferrer"
                className="font-semibold text-blue-600 underline hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
                https://api.tacticusgame.com
            </a>{' '}
            and register it in the user menu.
        </p>
    </div>
);

export const GuildRosterSnapshots = () => {
    const { userInfo } = useAuth();
    const hasGuildApiKey = !!userInfo?.tacticusGuildApiKey;
    const guildApiKey = userInfo?.tacticusGuildApiKey ?? '';
    const previousKeyReference = useRef<string | undefined>(undefined);

    const [members, setMembers] = useState<string[] | undefined>(cachedMembers);
    const [memberStates, setMemberStates] = useState<Map<string, MemberState>>(cachedMemberStates);
    const [isLoading, setIsLoading] = useState(false);
    const [hasLoadedOnce, setHasLoadedOnce] = useState(cachedHasLoadedOnce);
    const [topLevelError, setTopLevelError] = useState<string | undefined>();
    const [activeTab, setActiveTab] = useState<GuildTab>('rosters');

    // Reset cache when the guild API key changes (e.g. user switches accounts)
    useEffect(() => {
        const previous = previousKeyReference.current;
        previousKeyReference.current = guildApiKey;
        if (previous === undefined || previous === guildApiKey) return;
        cachedMembers = undefined;
        cachedMemberStates = new Map();
        cachedHasLoadedOnce = false;
        setMembers(undefined);
        setMemberStates(new Map());
        setHasLoadedOnce(false);
    }, [guildApiKey]);

    if (!hasGuildApiKey) {
        return <NoKeyMessage />;
    }

    const loadMembers = async () => {
        setIsLoading(true);
        setTopLevelError(undefined);

        const { data, error: apiError } = await getGuildMembersApi();
        if (apiError) {
            setTopLevelError(typeof apiError === 'string' ? apiError : (apiError.message ?? 'Failed to load members'));
            setIsLoading(false);
            return;
        }

        const ids = data ?? [];
        cachedMembers = ids;
        setMembers(ids);
        const initialStates = new Map(ids.map(id => [id, { status: 'loading' } as MemberState]));
        cachedMemberStates = initialStates;
        setMemberStates(initialStates);

        if (ids.length === 0) {
            cachedHasLoadedOnce = true;
            setHasLoadedOnce(true);
            setIsLoading(false);
            return;
        }

        let done = 0;
        for (const id of ids) {
            getGuildMemberRosterApi(id).then(({ data: rosterData, error }) => {
                let state: MemberState;
                if (error) {
                    state = parseErrorState(id, error);
                } else if (rosterData) {
                    state = {
                        status: 'success',
                        playerName: rosterData.playerName,
                        roster: rosterData,
                        parsed: parseUnits(rosterData.units),
                    };
                } else {
                    state = { status: 'not-shared' };
                }

                setMemberStates(previous => {
                    const next = new Map(previous).set(id, state);
                    cachedMemberStates = next;
                    return next;
                });

                done++;
                if (done === ids.length) {
                    cachedHasLoadedOnce = true;
                    setHasLoadedOnce(true);
                    setIsLoading(false);
                }
            });
        }
    };

    return (
        <UnitPortraitAssetsProvider>
            <div className="flex flex-col gap-4 px-4 py-4">
                <h1 className="text-2xl font-bold">Guild</h1>

                <div className="flex items-center gap-4">
                    <Button intent="primary" isDisabled={isLoading} onPress={loadMembers}>
                        {hasLoadedOnce ? 'Refresh Members' : 'Load Members'}
                    </Button>
                    {isLoading && (
                        <span className="inline-block size-4 animate-spin rounded-full border-2 border-gray-400 border-t-transparent" />
                    )}
                </div>

                {topLevelError && <p className="text-sm text-red-600 dark:text-red-400">{topLevelError}</p>}

                <DebugJson label="guild/members" value={members ?? 'not loaded'} />
                <DebugJson label="guild/member/{id} (all states)" value={Object.fromEntries(memberStates)} />
                <DebugJson
                    label="guild/roster/member"
                    value={Object.fromEntries(
                        [...memberStates.entries()].flatMap(([id, s]) =>
                            s.status === 'success' ? [[id, s.roster]] : []
                        )
                    )}
                />

                <Tabs value={activeTab} onChange={(_, value: GuildTab) => setActiveTab(value)}>
                    <Tab label="Rosters" value="rosters" />
                    <Tab label="Roster Snapshots" value="roster-snapshots" />
                    <Tab label="Members" value="members" />
                    <Tab label="Shared Leaderboards" value="shared-leaderboards" />
                </Tabs>

                <div>
                    {activeTab === 'rosters' && <RostersTab members={members} memberStates={memberStates} />}
                    {activeTab === 'roster-snapshots' && (
                        <RosterSnapshotsTab members={members} memberStates={memberStates} onLoadMembers={loadMembers} />
                    )}
                    {activeTab === 'members' && (
                        <MembersTab memberStates={memberStates} rostersLoaded={hasLoadedOnce} />
                    )}
                    {activeTab === 'shared-leaderboards' && <SharedLeaderboardsTab />}
                </div>
            </div>
        </UnitPortraitAssetsProvider>
    );
};
