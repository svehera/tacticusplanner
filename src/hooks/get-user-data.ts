import { useAuth } from '../contexts/auth';
import { GlobalService, PersonalDataService, usePersonalData } from '../services';
import { useEffect } from 'react';
import { setUserDataApi, getUserDataApi } from '../api/api-functions';
import { AxiosError } from 'axios';
import { IErrorResponse } from '../api/api-interfaces';
import { enqueueSnackbar } from 'notistack';

export const getUserData = () => {
    const { isAuthenticated, setUsername, logout } = useAuth();
    const { personalData } = usePersonalData();
    
    useEffect(() => {
        if(isAuthenticated) {
            getUserDataApi()
                .then(data2 => {
                    const localLastModified= personalData.modifiedDate && new Date(personalData.modifiedDate);
                    const serverLastModified= new Date(data2.data.lastModifiedDate);

                    setUsername(data2.data.username);

                    if(data2.data.data && (!localLastModified || localLastModified < serverLastModified)) {
                        PersonalDataService._data.next(data2.data.data);
                        PersonalDataService.save(serverLastModified, false);
                        GlobalService.init();
                        enqueueSnackbar('Synced with latest server data.', { variant: 'info' });
                    } else if (localLastModified && localLastModified > serverLastModified) {
                        setUserDataApi(personalData)
                            .then(() => enqueueSnackbar('Pushed local data to server.', { variant: 'info' }))
                            .catch((err: AxiosError<IErrorResponse>) => {
                                if (err.response?.status === 401) {
                                    logout();
                                    enqueueSnackbar('Session expired. Please re-login.', { variant: 'error' });
                                } else {
                                    enqueueSnackbar('Failed to push data to server. Please do manual back-up.', { variant: 'error' });
                                }
                            });
                    }
                })
                .catch((err: AxiosError<IErrorResponse>) => {
                    if (err.response?.status === 401) {
                        logout();
                        enqueueSnackbar('Session expired. Please re-login.', { variant: 'error' });
                    } else {
                        enqueueSnackbar('Failed to fetch data from server. Try again later', { variant: 'error' });
                    }
                });
        }
    }, [isAuthenticated]);
};