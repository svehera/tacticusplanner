import axios, { AxiosError, AxiosResponse, Method } from 'axios';

import API from './api';
import { IErrorResponse } from './api.models';

export const makeApiCall = <TResponse, TRequestBody = any>(
    method: Method,
    url: string,
    body?: TRequestBody
): Promise<{ data: TResponse | null; error: AxiosError<IErrorResponse> | string | null }> => {
    const fetchData = async () => {
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
                error.message = error?.response?.data?.message || error.message;
                return { data: null, error };
            } else {
                console.error(`Unexpected error during API call`, error);
                return { data: null, error: error.message };
            }
        }
    };

    return fetchData();
};
