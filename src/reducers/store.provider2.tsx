import { AxiosError } from 'axios';
import { isEqual } from 'lodash';
import { enqueueSnackbar } from 'notistack';
import React, { useEffect, useMemo, useState } from 'react';
import { isMobile } from 'react-device-detect';

import { guildReducer } from 'src/reducers/guildReducer';
import { guildWarReducer } from 'src/reducers/guildWarReducer';
import { mowsReducer } from 'src/reducers/mows.reducer';
import { teamsReducer } from 'src/reducers/teams.reducer';

import { IErrorResponse } from '@/fsd/5-shared/api';
import { useAuth } from '@/fsd/5-shared/model';

import { GlobalState } from '../models/global-state';
import { IDispatchContext, IGlobalState } from '../models/interfaces';
import { convertData, PersonalDataLocalStorage } from '../services';

import { autoTeamsPreferencesReducer } from './auto-teams-settings.reducer';
import { campaignsProgressReducer } from './campaigns-progress.reducer';
import { charactersReducer } from './characters.reducer';
import { dailyRaidsPreferencesReducer } from './daily-raids-settings.reducer';
import { dailyRaidsReducer } from './dailyRaids.reducer';
import { goalsReducer } from './goals.reducer';
import { inventoryReducer } from './inventory.reducer';
import { leProgressReducer } from './le-progress.reducer';
import { leSelectedRequirementsReducer } from './le-selected-requirements.reducer';
import { leSelectedTeamsReducer } from './le-selected-teams.reducer';
import { selectedTeamsOrderReducer } from './selected-teams-order.reducer';
import { DispatchContext, StoreContext } from './store.provider';
import { setUserDataApi, getUserDataApi } from './user.endpoints';
import { viewPreferencesReducer } from './view-settings.reducer';

export const StoreProvider = ({ children }: React.PropsWithChildren) => {
    const { isAuthenticated, setUser, setUserInfo, logout } = useAuth();
    const localStore = useMemo(() => new PersonalDataLocalStorage(), []);

    const [globalState, setGlobalState] = useState(() => {
        const data = localStore.getData();
        return new GlobalState(data);
    });

    const [modified, setModified] = useState(false);
    const [saveTimeoutId, setSaveTimeoutId] = useState<NodeJS.Timeout>();
    const [abortController, setAbortController] = useState<AbortController>();

    const [modifiedDate, setModifiedDate] = useState(globalState.modifiedDate);
    const [seenAppVersion, setSeenAppVersion] = useState<string | undefined | null>(globalState.seenAppVersion);

    const [characters, dispatchCharacters] = React.useReducer(charactersReducer, globalState.characters);
    const [mows, dispatchMows] = React.useReducer(mowsReducer, globalState.mows);
    const [goals, dispatchGoals] = React.useReducer(goalsReducer, globalState.goals);
    const [teams, dispatchTeams] = React.useReducer(teamsReducer, globalState.teams);
    const [viewPreferences, dispatchViewPreferences] = React.useReducer(
        viewPreferencesReducer,
        globalState.viewPreferences
    );
    const [dailyRaidsPreferences, dispatchDailyRaidsPreferences] = React.useReducer(
        dailyRaidsPreferencesReducer,
        globalState.dailyRaidsPreferences
    );
    const [autoTeamsPreferences, dispatchAutoTeamsPreferences] = React.useReducer(
        autoTeamsPreferencesReducer,
        globalState.autoTeamsPreferences
    );
    const [selectedTeamOrder, dispatchSelectedTeamsOrder] = React.useReducer(
        selectedTeamsOrderReducer,
        globalState.selectedTeamOrder
    );
    const [leSelectedRequirements, dispatchLeSelectedRequirements] = React.useReducer(
        leSelectedRequirementsReducer,
        globalState.leSelectedRequirements
    );
    const [leSelectedTeams, dispatchLeSelectedTeams] = React.useReducer(
        leSelectedTeamsReducer,
        globalState.leSelectedTeams
    );
    const [leProgress, dispatchLeProgress] = React.useReducer(leProgressReducer, globalState.leProgress);

    const [campaignsProgress, dispatchCampaignsProgress] = React.useReducer(
        campaignsProgressReducer,
        globalState.campaignsProgress
    );

    const [inventory, dispatchInventory] = React.useReducer(inventoryReducer, globalState.inventory);
    const [dailyRaids, dispatchDailyRaids] = React.useReducer(dailyRaidsReducer, globalState.dailyRaids);
    const [guildWar, dispatchGuildWar] = React.useReducer(guildWarReducer, globalState.guildWar);
    const [guild, dispatchGuild] = React.useReducer(guildReducer, globalState.guild);

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
            goals: wrapDispatch(dispatchGoals),
            viewPreferences: wrapDispatch(dispatchViewPreferences),
            autoTeamsPreferences: wrapDispatch(dispatchAutoTeamsPreferences),
            dailyRaidsPreferences: wrapDispatch(dispatchDailyRaidsPreferences),
            selectedTeamOrder: wrapDispatch(dispatchSelectedTeamsOrder),
            leSelectedRequirements: wrapDispatch(dispatchLeSelectedRequirements),
            leSelectedTeams: wrapDispatch(dispatchLeSelectedTeams),
            leProgress: wrapDispatch(dispatchLeProgress),
            campaignsProgress: wrapDispatch(dispatchCampaignsProgress),
            inventory: wrapDispatch(dispatchInventory),
            dailyRaids: wrapDispatch(dispatchDailyRaids),
            guildWar: wrapDispatch(dispatchGuildWar),
            guild: wrapDispatch(dispatchGuild),
            setStore: (data: IGlobalState, modified: boolean, reset = false) => {
                dispatchCharacters({ type: 'Set', value: data.characters });
                dispatchMows({ type: 'Set', value: data.mows });
                dispatchGoals({ type: 'Set', value: data.goals });
                dispatchTeams({ type: 'Set', value: data.teams });
                dispatchViewPreferences({ type: 'Set', value: data.viewPreferences });
                dispatchDailyRaidsPreferences({ type: 'Set', value: data.dailyRaidsPreferences });
                dispatchAutoTeamsPreferences({ type: 'Set', value: data.autoTeamsPreferences });
                dispatchSelectedTeamsOrder({ type: 'Set', value: data.selectedTeamOrder });
                dispatchLeSelectedRequirements({ type: 'Set', value: data.leSelectedRequirements });
                dispatchLeSelectedTeams({ type: 'Set', value: data.leSelectedTeams });
                dispatchLeProgress({ type: 'Set', value: data.leProgress });
                dispatchCampaignsProgress({ type: 'Set', value: data.campaignsProgress });
                dispatchInventory({ type: 'Set', value: data.inventory });
                dispatchDailyRaids({ type: 'Set', value: data.dailyRaids });
                dispatchGuildWar({ type: 'Set', value: data.guildWar });
                dispatchGuild({ type: 'Set', value: data.guild });

                if (modified) {
                    setModified(true);
                    setModifiedDate(data.modifiedDate);
                }

                if (reset) {
                    setModifiedDate(undefined);
                }

                setGlobalState(data);
            },
            seenAppVersion: wrapDispatch(setSeenAppVersion),
        }),
        [
            dispatchCharacters,
            dispatchViewPreferences,
            dispatchAutoTeamsPreferences,
            dispatchSelectedTeamsOrder,
            dispatchLeSelectedRequirements,
            dispatchLeSelectedTeams,
            dispatchGoals,
            dispatchLeProgress,
            dispatchCampaignsProgress,
            dispatchDailyRaidsPreferences,
            dispatchGuildWar,
            dispatchGuild,
            dispatchTeams,
            setGlobalState,
        ]
    );

    useEffect(() => {
        if (!modified) {
            return;
        }

        console.log(
            'in useEffect, characters=',
            characters.find(c => c.snowprintId === 'orksRuntherd')
        );
        const newValue: IGlobalState = {
            characters,
            mows,
            teams,
            viewPreferences,
            autoTeamsPreferences,
            selectedTeamOrder,
            leSelectedRequirements,
            leSelectedTeams,
            leProgress,
            goals,
            modifiedDate,
            seenAppVersion,
            campaignsProgress,
            dailyRaidsPreferences,
            inventory,
            dailyRaids,
            guildWar,
            guild,
        };
        console.log(
            'newValue characters=',
            newValue.characters.find(c => c.snowprintId === 'orksRuntherd')
        );
        const storeValue = GlobalState.toStore(newValue);

        setGlobalState(newValue);
        localStore.setData(storeValue);
        setModified(false);

        if (isAuthenticated) {
            abortController?.abort();
            clearTimeout(saveTimeoutId);
            const controller = new AbortController();
            const timeoutId = setTimeout(
                () => {
                    setUserDataApi(storeValue, controller.signal)
                        .then(({ data }) => {
                            const { modifiedDateTicks } = data;
                            localStorage.setItem('TP-ModifiedDateTicks', modifiedDateTicks);
                            enqueueSnackbar('Pushed local data to server.', { variant: 'success' });
                        })
                        .catch((err: AxiosError<IErrorResponse>) => {
                            if (err.code === 'ERR_CANCELED') {
                                return;
                            }
                            if (err.response?.status === 401) {
                                enqueueSnackbar('Session expired. Please re-login.', { variant: 'error' });
                            } else if (err.response?.status === 409) {
                                enqueueSnackbar(
                                    'Conflict. Please refresh the page to pull latest changes. Your current changes will be lost',
                                    { variant: 'error' }
                                );
                            } else {
                                enqueueSnackbar('Failed to push data to server. Please do manual back-up.', {
                                    variant: 'error',
                                });
                            }
                        });
                },
                isMobile ? 1000 : 10000
            );
            setSaveTimeoutId(timeoutId);
            setAbortController(controller);
        }
    }, [modified]);

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
                const localModifiedDateTicks = localStorage.getItem('TP-ModifiedDateTicks');

                const hasDataConflict = localModifiedDateTicks !== serverModifiedDateTicks;

                const shouldAcceptServerData =
                    !isFirstLogin && (isFreshData || modifiedDate < serverLastModified || hasDataConflict);
                const shouldPushLocalData =
                    !isFreshData && !hasDataConflict && (isFirstLogin || modifiedDate > serverLastModified);

                localStorage.setItem('TP-ModifiedDateTicks', serverModifiedDateTicks);

                if (shouldAcceptServerData) {
                    const serverData = convertData(data);
                    const localData = GlobalState.toStore(globalState);

                    const isDataEqual = isEqual(
                        { ...localData, modifiedDate: undefined },
                        { ...serverData, modifiedDate: undefined }
                    );

                    if (!isDataEqual) {
                        const newState = new GlobalState(serverData);
                        dispatch.setStore(newState, false, false);
                        localStore.setData(GlobalState.toStore(newState));
                        if (hasDataConflict && modifiedDate && modifiedDate > serverLastModified) {
                            enqueueSnackbar('There has been conflict. Your local changes are overridden with server', {
                                variant: 'warning',
                            });
                        }
                        enqueueSnackbar('Synced with latest server data.', { variant: 'info' });
                    }

                    setModifiedDate(serverLastModified);
                    localStore.setData({ modifiedDate: serverLastModified });
                } else if (shouldPushLocalData) {
                    setUserDataApi(GlobalState.toStore(globalState))
                        .then(({ data }) => {
                            const { modifiedDateTicks } = data;
                            localStorage.setItem('TP-ModifiedDateTicks', modifiedDateTicks);
                            return enqueueSnackbar('Pushed local data to server.', { variant: 'info' });
                        })
                        .catch((err: AxiosError<IErrorResponse>) => {
                            if (err.response?.status === 401) {
                                logout();
                                enqueueSnackbar('Session expired. Please re-login.', { variant: 'error' });
                            } else if (err.response?.status === 409) {
                                enqueueSnackbar(
                                    'Conflict. Please refresh the page to pull latest changes. Your current changes will be lost',
                                    { variant: 'error' }
                                );
                            } else {
                                enqueueSnackbar('Failed to push data to server. Please do manual back-up.', {
                                    variant: 'error',
                                });
                            }
                        });
                }
            })
            .catch((err: AxiosError<IErrorResponse>) => {
                if (err.response?.status === 401) {
                    logout();
                    enqueueSnackbar('Session expired. Please re-login.', { variant: 'error' });
                } else {
                    console.error(err);
                    enqueueSnackbar('Failed to fetch data from server. Try again later', { variant: 'error' });
                }
            });
    }, [isAuthenticated]);

    useEffect(() => {
        const sixtySeconds = 1000 * 60;
        const oneDay = 60 * 60 * 24 * 1000;

        const timerId = setInterval(() => {
            const lastBackup = localStore.getBackupDate();
            if (!lastBackup) {
                const localData = GlobalState.toStore(globalState);
                localStore.storeBackup(localData);
            } else {
                const now = new Date();
                const timeDifference = now.getTime() - lastBackup.getTime();
                if (timeDifference > oneDay) {
                    const localData = GlobalState.toStore(globalState);
                    localStore.storeBackup(localData);
                }
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
