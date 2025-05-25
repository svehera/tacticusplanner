import axios, { AxiosError, AxiosResponse, Method } from 'axios';

import API from './api';
import { IErrorResponse } from './api.models';
import guild from './guild.json';
import guildRaid from './guildRaid.json';

export const makeApiCall = <TResponse, TRequestBody = any>(
    method: Method,
    url: string,
    body?: TRequestBody
): Promise<{ data: TResponse | null; error: string | null }> => {
    const fetchData = async () => {
        switch (url) {
            case 'guild':
                return { data: guild, error: null };
            case 'guildRaid':
                return { data: guildRaid, error: null };
        }
        try {
            const response = await API<TResponse, AxiosResponse<TResponse>, TRequestBody>({
                url: url,
                method: method,
                data: body,
            });

            const data = response?.data;

            return { data, error: null };
        } catch (err: any) {
            console.error(err);
            const error = err as Error | AxiosError<IErrorResponse>;
            // replace here with your own error handling
            if (axios.isAxiosError(error)) {
                if (error.code === AxiosError.ERR_CANCELED) {
                    console.info('Request was canceled');
                    return { data: null, error: null };
                }
                return { data: null, error: error?.response?.data?.message || error.message };
            } else {
                return { data: null, error: error.message };
            }
        }
    };

    return fetchData();
};
