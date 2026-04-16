import { AxiosError } from 'axios';
import { isEqual } from 'lodash';
import { enqueueSnackbar } from 'notistack';
import React, { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';

import { gameModeTokensActionReducer } from '@/reducers/game-mode-tokens-reducer';
import { guildReducer } from '@/reducers/guild-reducer';
import { guildWarReducer } from '@/reducers/guild-war-reducer';
import { mowsReducer } from 'src/reducers/mows.reducer';
import { teamsReducer } from 'src/reducers/teams.reducer';
import { teams2Reducer } from 'src/reducers/teams2.reducer';
import { warDefense2Reducer } from 'src/reducers/war-defense2.reducer';
import { warOffense2Reducer } from 'src/reducers/war-offense2.reducer';

import { IErrorResponse } from '@/fsd/5-shared/api';
import { useAuth } from '@/fsd/5-shared/model';

import { GlobalState } from '../models/global-state';
import { IDispatchContext, IGlobalState, IPersonalData2 } from '../models/interfaces';
import { convertData, PersonalDataLocalStorage } from '../services';

import { autoTeamsPreferencesReducer } from './auto-teams-settings.reducer';
import { campaignsProgressReducer } from './campaigns-progress.reducer';
import { charactersReducer } from './characters.reducer';
import { dailyRaidsPreferencesReducer } from './daily-raids-settings.reducer';
import { dailyRaidsReducer } from './daily-raids.reducer';
import { goalsReducer } from './goals.reducer';
import { inventoryReducer } from './inventory.reducer';
import { leProgressReducer } from './le-progress.reducer';
import { leSelectedTeamsReducer } from './le-selected-teams.reducer';
import { leSettingsReducer } from './le-settings.reducer';
import { rosterSnapshotsActionReducer } from './roster-snapshots-reducer';
import { selectedTeamsOrderReducer } from './selected-teams-order.reducer';
import { DispatchContext, StoreContext } from './store.provider';
import { setUserDataApi, getUserDataApi } from './user.endpoints';
import { viewPreferencesReducer } from './view-settings.reducer';
import { xpIncomeActionReducer } from './xp-income-reducer';
import { xpUseActionReducer } from './xp-use-reducer';

// --- Local-only version marker for in-memory/localStorage state (never sent to backend)
const LOCAL_VERSION_KEY = 'TP-LocalVersion';
function getLocalVersion(): number {
    const v = localStorage.getItem(LOCAL_VERSION_KEY);
    return v ? Number.parseInt(v, 10) : 0;
}

export const StoreProvider = ({ children }: React.PropsWithChildren) => {
    const { isAuthenticated, setUser, setUserInfo, logout } = useAuth();
    const localStore = useMemo(() => new PersonalDataLocalStorage(), []);

    // Track local-only version for in-memory/localStorage state
    const [localVersion, setLocalVersion] = useState(() => getLocalVersion());
    const [globalState, setGlobalState] = useState(() => {
        const data = localStore.getData();
        return { ...new GlobalState(data), __localVersion: getLocalVersion() };
    });

    const [modified, setModified] = useState(false);
    const saveTimeoutReference = useRef<NodeJS.Timeout | undefined>(undefined);
    const isSaveInFlightReference = useRef(false);
    const queuedStoreValueReference = useRef<IPersonalData2 | undefined>(undefined);
    const modifiedDateTicksReference = useRef(localStorage.getItem('TP-ModifiedDateTicks') ?? '');

    const [modifiedDate, setModifiedDate] = useState(globalState.modifiedDate);
    const [seenAppVersion, setSeenAppVersion] = useState<string | undefined>(globalState.seenAppVersion);

    // Refs so the server sync effect can read the latest values without re-running on every change.
    const globalStateReference = useRef(globalState);
    globalStateReference.current = globalState;
    const modifiedDateReference = useRef(modifiedDate);
    modifiedDateReference.current = modifiedDate;

    const [characters, dispatchCharacters] = useReducer(charactersReducer, globalState.characters);
    const [mows, dispatchMows] = useReducer(mowsReducer, globalState.mows);
    const [goals, dispatchGoals] = useReducer(goalsReducer, globalState.goals);
    const [teams, dispatchTeams] = useReducer(teamsReducer, globalState.teams);
    const [teams2, dispatchTeams2] = useReducer(teams2Reducer, globalState.teams2);
    const [gameModeTokens, dispatchGameModeTokens] = useReducer(
        gameModeTokensActionReducer,
        globalState.gameModeTokens
    );
    const [warDefense2, dispatchWarDefense2] = useReducer(warDefense2Reducer, globalState.warDefense2);
    const [warOffense2, dispatchWarOffense2] = useReducer(warOffense2Reducer, globalState.warOffense2);
    const [viewPreferences, dispatchViewPreferences] = useReducer(viewPreferencesReducer, globalState.viewPreferences);
    const [dailyRaidsPreferences, dispatchDailyRaidsPreferences] = useReducer(
        dailyRaidsPreferencesReducer,
        globalState.dailyRaidsPreferences
    );
    const [autoTeamsPreferences, dispatchAutoTeamsPreferences] = useReducer(
        autoTeamsPreferencesReducer,
        globalState.autoTeamsPreferences
    );
    const [selectedTeamOrder, dispatchSelectedTeamsOrder] = useReducer(
        selectedTeamsOrderReducer,
        globalState.selectedTeamOrder
    );
    const [leSelectedTeams, dispatchLeSelectedTeams] = useReducer(leSelectedTeamsReducer, globalState.leSelectedTeams);
    const [leProgress, dispatchLeProgress] = useReducer(leProgressReducer, globalState.leProgress);
    const [leSettings, dispatchLeSettings] = useReducer(leSettingsReducer, globalState.leSettings);

    const [campaignsProgress, dispatchCampaignsProgress] = useReducer(
        campaignsProgressReducer,
        globalState.campaignsProgress
    );

    const [inventory, dispatchInventory] = useReducer(inventoryReducer, globalState.inventory);
    const [dailyRaids, dispatchDailyRaids] = useReducer(dailyRaidsReducer, globalState.dailyRaids);
    const [guildWar, dispatchGuildWar] = useReducer(guildWarReducer, globalState.guildWar);
    const [guild, dispatchGuild] = useReducer(guildReducer, globalState.guild);
    const [xpUse, dispatchXpUse] = useReducer(xpUseActionReducer, globalState.xpUse);
    const [xpIncome, dispatchXpIncome] = useReducer(xpIncomeActionReducer, globalState.xpIncome);
    const [rosterSnapshots, dispatchRosterSnapshots] = useReducer(
        rosterSnapshotsActionReducer,
        globalState.rosterSnapshots
    );

    const setModifiedDateTicks = useCallback((modifiedDateTicks: string) => {
        modifiedDateTicksReference.current = modifiedDateTicks;
        localStorage.setItem('TP-ModifiedDateTicks', modifiedDateTicks);
    }, []);

    const syncModifiedDateTicksFromServer = useCallback(async () => {
        try {
            const response = await getUserDataApi();
            if (!response.data) {
                return;
            }

            const { modifiedDateTicks: serverModifiedDateTicks } = response.data;
            setModifiedDateTicks(serverModifiedDateTicks);
        } catch {
            // Best effort. Keep local ticks as-is if refresh fails.
        }
    }, [setModifiedDateTicks]);

    const pushDataToServer = useCallback(
        (storeValue: IPersonalData2, successVariant: 'success' | 'info' = 'success') => {
            if (isSaveInFlightReference.current) {
                queuedStoreValueReference.current = storeValue;
                return;
            }

            isSaveInFlightReference.current = true;
            const currentModifiedDateTicks = modifiedDateTicksReference.current;
            let saveSucceeded = false;

            setUserDataApi(storeValue, currentModifiedDateTicks)
                .then(({ data }) => {
                    const { modifiedDateTicks } = data;
                    setModifiedDateTicks(modifiedDateTicks);
                    saveSucceeded = true;
                })
                .catch((error: AxiosError<IErrorResponse>) => {
                    if (error.code === 'ERR_CANCELED') {
                        void syncModifiedDateTicksFromServer();
                        return;
                    }

                    if (error.response?.status === 401) {
                        logout();
                        queuedStoreValueReference.current = undefined;
                        enqueueSnackbar('Session expired. Please re-login.', { variant: 'error' });
                    } else if (error.response?.status === 409) {
                        queuedStoreValueReference.current = undefined;
                        enqueueSnackbar(
                            'Conflict. Please refresh the page to pull latest changes. Your current changes will be lost',
                            { variant: 'error' }
                        );
                    } else {
                        queuedStoreValueReference.current = undefined;
                        enqueueSnackbar(
                            'Failed to push data to server. Please export JSON, refresh, wait for server data, then import JSON.',
                            {
                                variant: 'error',
                            }
                        );
                    }
                })
                .finally(() => {
                    isSaveInFlightReference.current = false;

                    const queuedStoreValue = queuedStoreValueReference.current;
                    queuedStoreValueReference.current = undefined;

                    if (queuedStoreValue) {
                        pushDataToServer(queuedStoreValue, successVariant);
                    } else if (saveSucceeded) {
                        enqueueSnackbar('Pushed local data to server.', { variant: successVariant });
                    }
                });
        },
        [logout, setModifiedDateTicks, syncModifiedDateTicksFromServer]
    );

    function wrapDispatch<T>(dispatch: React.Dispatch<T>): React.Dispatch<T> {
        return (action: T) => {
            requestAnimationFrame(() => {
                dispatch(action);
                setModified(true);
                setModifiedDate(new Date());
            });
        };
    }

    const dispatch = useMemo<IDispatchContext>(
        () => ({
            characters: wrapDispatch(dispatchCharacters),
            mows: wrapDispatch(dispatchMows),
            teams: wrapDispatch(dispatchTeams),
            teams2: wrapDispatch(dispatchTeams2),
            warDefense2: wrapDispatch(dispatchWarDefense2),
            warOffense2: wrapDispatch(dispatchWarOffense2),
            goals: wrapDispatch(dispatchGoals),
            viewPreferences: wrapDispatch(dispatchViewPreferences),
            autoTeamsPreferences: wrapDispatch(dispatchAutoTeamsPreferences),
            dailyRaidsPreferences: wrapDispatch(dispatchDailyRaidsPreferences),
            selectedTeamOrder: wrapDispatch(dispatchSelectedTeamsOrder),
            leSelectedTeams: wrapDispatch(dispatchLeSelectedTeams),
            leProgress: wrapDispatch(dispatchLeProgress),
            leSettings: wrapDispatch(dispatchLeSettings),
            campaignsProgress: wrapDispatch(dispatchCampaignsProgress),
            inventory: wrapDispatch(dispatchInventory),
            dailyRaids: wrapDispatch(dispatchDailyRaids),
            guildWar: wrapDispatch(dispatchGuildWar),
            guild: wrapDispatch(dispatchGuild),
            xpIncome: wrapDispatch(dispatchXpIncome),
            xpUse: wrapDispatch(dispatchXpUse),
            rosterSnapshots: wrapDispatch(dispatchRosterSnapshots),
            gameModeTokens: wrapDispatch(dispatchGameModeTokens),
            setStore: (data: IGlobalState, modified: boolean, reset = false) => {
                // Only update if incoming version is newer
                setGlobalState(current => {
                    const incomingVersion = data.__localVersion ?? 0;
                    const currentVersion = current.__localVersion ?? 0;
                    if (incomingVersion > currentVersion) {
                        dispatchCharacters({ type: 'Set', value: data.characters });
                        dispatchMows({ type: 'Set', value: data.mows });
                        dispatchGoals({ type: 'Set', value: data.goals });
                        dispatchTeams({ type: 'Set', value: data.teams });
                        dispatchTeams2({ type: 'Set', value: data.teams2 });
                        dispatchWarDefense2({ type: 'Set', value: data.warDefense2 });
                        dispatchWarOffense2({ type: 'Set', value: data.warOffense2 });
                        dispatchViewPreferences({ type: 'Set', value: data.viewPreferences });
                        dispatchDailyRaidsPreferences({ type: 'Set', value: data.dailyRaidsPreferences });
                        dispatchAutoTeamsPreferences({ type: 'Set', value: data.autoTeamsPreferences });
                        dispatchSelectedTeamsOrder({ type: 'Set', value: data.selectedTeamOrder });
                        dispatchLeSelectedTeams({ type: 'Set', value: data.leSelectedTeams });
                        dispatchLeProgress({ type: 'Set', value: data.leProgress });
                        dispatchLeSettings({ type: 'Set', value: data.leSettings });
                        dispatchCampaignsProgress({ type: 'Set', value: data.campaignsProgress });
                        dispatchInventory({ type: 'Set', value: data.inventory });
                        dispatchDailyRaids({ type: 'Set', value: data.dailyRaids });
                        dispatchGuildWar({ type: 'Set', value: data.guildWar });
                        dispatchGuild({ type: 'Set', value: data.guild });
                        dispatchXpIncome({ type: 'Set', value: data.xpIncome });
                        dispatchXpUse({ type: 'Set', value: data.xpUse });
                        dispatchRosterSnapshots({ type: 'Set', value: data.rosterSnapshots });
                        dispatchGameModeTokens({ type: 'Set', value: data.gameModeTokens });
                        if (modified) {
                            setModified(true);
                            setModifiedDate(data.modifiedDate);
                        }
                        if (reset) {
                            setModifiedDate(undefined);
                        }
                        return { ...data, __localVersion: incomingVersion };
                    }
                    return current;
                });
            },
            seenAppVersion: wrapDispatch(setSeenAppVersion),
        }),
        [
            dispatchCharacters,
            dispatchViewPreferences,
            dispatchAutoTeamsPreferences,
            dispatchSelectedTeamsOrder,
            dispatchLeSelectedTeams,
            dispatchGoals,
            dispatchLeProgress,
            dispatchCampaignsProgress,
            dispatchDailyRaidsPreferences,
            dispatchGuildWar,
            dispatchGuild,
            dispatchTeams,
            dispatchTeams2,
            dispatchWarDefense2,
            dispatchWarOffense2,
            dispatchXpIncome,
            dispatchXpUse,
            dispatchRosterSnapshots,
            dispatchGameModeTokens,
            setGlobalState,
        ]
    );

    useEffect(() => {
        if (!modified) {
            return;
        }
        // Increment and persist localVersion on every state change
        const nextVersion = localVersion + 1;
        localStorage.setItem(LOCAL_VERSION_KEY, nextVersion.toString());
        setLocalVersion(nextVersion);
        const newValue: IGlobalState = {
            characters,
            mows,
            teams,
            teams2,
            warDefense2,
            warOffense2,
            viewPreferences,
            autoTeamsPreferences,
            selectedTeamOrder,
            leSelectedTeams,
            leProgress,
            leSettings,
            goals,
            modifiedDate,
            seenAppVersion,
            campaignsProgress,
            dailyRaidsPreferences,
            inventory,
            dailyRaids,
            guildWar,
            guild,
            xpIncome,
            xpUse,
            rosterSnapshots,
            gameModeTokens,
            __localVersion: nextVersion,
        };
        const storeValue = GlobalState.toStore(newValue);
        setGlobalState({ ...newValue, __localVersion: nextVersion });
        localStore.setData(storeValue);
        setModified(false);
        if (isAuthenticated) {
            clearTimeout(saveTimeoutReference.current);
            saveTimeoutReference.current = setTimeout(() => {
                pushDataToServer(storeValue, 'success');
            }, 100);
        }
    }, [
        autoTeamsPreferences,
        campaignsProgress,
        characters,
        dailyRaids,
        dailyRaidsPreferences,
        gameModeTokens,
        goals,
        guild,
        guildWar,
        inventory,
        isAuthenticated,
        leProgress,
        leSelectedTeams,
        leSettings,
        modified,
        modifiedDate,
        mows,
        localStore,
        pushDataToServer,
        rosterSnapshots,
        seenAppVersion,
        selectedTeamOrder,
        teams,
        teams2,
        viewPreferences,
        warDefense2,
        warOffense2,
        xpIncome,
        xpUse,
        localVersion,
    ]);

    useEffect(() => {
        return () => {
            clearTimeout(saveTimeoutReference.current);
        };
    }, []);

    function doDailyRefresh(lastRefreshDateUTC: string): void {
        const currentDate = new Date();
        const lastRefreshDate = new Date(lastRefreshDateUTC);

        // Set the hours, minutes, seconds, and milliseconds to 0 for accurate comparison
        currentDate.setUTCHours(0, 0, 0, 0);
        lastRefreshDate.setUTCHours(0, 0, 0, 0);

        // Compare timestamps to check if last refresh date is yesterday or before
        const isYesterdayOrBefore = lastRefreshDate.getTime() < currentDate.getTime();

        if (isYesterdayOrBefore) {
            dispatch.dailyRaids({ type: 'ResetCompletedBattlesDaily' });
            enqueueSnackbar('Daily Reset Completed', { variant: 'info' });
        }
    }

    useEffect(() => {
        if (!isAuthenticated) {
            doDailyRefresh(dailyRaids.lastRefreshDateUTC);
            return;
        }
        getUserDataApi()
            .then(response => {
                if (!response.data) {
                    console.error(response.error);
                    enqueueSnackbar('Failed to fetch data from server. Try again later', { variant: 'error' });
                    return;
                }

                const {
                    data,
                    username,
                    lastModifiedDate,
                    shareToken,
                    role,
                    id,
                    modifiedDateTicks: serverModifiedDateTicks,
                    pendingTeamsCount,
                    rejectedTeamsCount,
                    tacticusApiKey,
                    tacticusGuildApiKey,
                    tacticusUserId,
                } = response.data;
                const serverLastModified = new Date(lastModifiedDate);
                const isFirstLogin = !data;
                const modifiedDate = modifiedDateReference.current;
                const isFreshData = !modifiedDate;
                setUser(username, shareToken);
                setUserInfo({
                    role,
                    username,
                    userId: id,
                    pendingTeamsCount,
                    rejectedTeamsCount,
                    tacticusApiKey,
                    tacticusGuildApiKey,
                    tacticusUserId,
                });
                const localModifiedDateTicks = modifiedDateTicksReference.current;

                const hasDataConflict = localModifiedDateTicks !== serverModifiedDateTicks;

                const localIsNewer = !!modifiedDate && modifiedDate > serverLastModified;

                // If ticks differ, someone else wrote to the server since we last synced —
                // that is the authoritative signal and must override the local clock comparison.
                const shouldAcceptServerData = !isFirstLogin && hasDataConflict;
                const shouldPushLocalData = !isFreshData && !hasDataConflict && (isFirstLogin || localIsNewer);

                setModifiedDateTicks(serverModifiedDateTicks);

                if (shouldAcceptServerData) {
                    const serverData = convertData(data);
                    const localData = GlobalState.toStore(globalStateReference.current);

                    const isDataEqual = isEqual(
                        { ...localData, modifiedDate: undefined },
                        { ...serverData, modifiedDate: undefined }
                    );

                    if (!isDataEqual) {
                        const newState = new GlobalState(serverData);
                        dispatch.setStore(
                            { ...newState, __localVersion: (globalStateReference.current.__localVersion ?? 0) + 1 },
                            false,
                            false
                        );
                        localStore.setData(GlobalState.toStore(newState));
                        if (hasDataConflict && modifiedDate && modifiedDate < serverLastModified) {
                            enqueueSnackbar(
                                'There has been a conflict. Your local changes are overridden with server',
                                {
                                    variant: 'warning',
                                }
                            );
                        }
                        enqueueSnackbar('Synced with latest server data.', {
                            key: 'synced-with-latest-server-data',
                            variant: 'info',
                            preventDuplicate: true,
                        });
                    }

                    setModifiedDate(serverLastModified);
                    localStore.setData({ modifiedDate: serverLastModified });
                } else if (shouldPushLocalData) {
                    clearTimeout(saveTimeoutReference.current);
                    pushDataToServer(GlobalState.toStore(globalStateReference.current), 'info');
                }
            })
            .catch((error: AxiosError<IErrorResponse>) => {
                if (error.response?.status === 401) {
                    logout();
                    enqueueSnackbar('Session expired. Please re-login.', { variant: 'error' });
                } else {
                    console.error(error);
                    enqueueSnackbar('Failed to fetch data from server. Try again later', { variant: 'error' });
                }
            });
    }, [
        dailyRaids.lastRefreshDateUTC,
        isAuthenticated,
        localStore,
        logout,
        pushDataToServer,
        setModifiedDateTicks,
        setUser,
        setUserInfo,
    ]);

    useEffect(() => {
        const sixtySeconds = 1000 * 60;
        const oneDay = 60 * 60 * 24 * 1000;

        const timerId = setInterval(() => {
            const lastBackup = localStore.getBackupDate();
            if (lastBackup) {
                const now = new Date();
                const timeDifference = now.getTime() - lastBackup.getTime();
                if (timeDifference > oneDay) {
                    const localData = GlobalState.toStore(globalState);
                    localStore.storeBackup(localData);
                }
            } else {
                const localData = GlobalState.toStore(globalState);
                localStore.storeBackup(localData);
            }
        }, sixtySeconds);

        return () => clearInterval(timerId);
    }, []);

    return (
        <DispatchContext.Provider value={dispatch}>
            <StoreContext.Provider value={globalState}> {children} </StoreContext.Provider>
        </DispatchContext.Provider>
    );
};
