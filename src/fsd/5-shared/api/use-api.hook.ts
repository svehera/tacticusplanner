import axios, { AxiosError, AxiosResponse, Method } from 'axios';
import { useEffect, useState } from 'react';

import API from './api';
import { IErrorResponse } from './api.models';

export const useApi = <TResponse, TRequestBody = any>(
    method: Method,
    url: string,
    body?: TRequestBody,
    deps?: Array<any>
): { loading: boolean; error: string | null; data: TResponse | null } => {
    const [loading, setLoading] = useState<boolean>(false);
    const [data, setData] = useState<TResponse | null>(null);
    const [error, setError] = useState<string | null>(null);
    const fetchData = async () => {
        try {
            setLoading(true);

            const response = await API<TResponse, AxiosResponse<TResponse>, TRequestBody>({
                url: url,
                method: method,
                data: body,
            });

            const data = response?.data;

            setData(data);
        } catch (error: any) {
            const castError = error as Error | AxiosError<IErrorResponse>;
            // replace here with your own error handling
            if (axios.isAxiosError(castError)) {
                if (castError.code === AxiosError.ERR_CANCELED) {
                    console.info('Request was canceled');
                    return;
                }
                setError(castError?.response?.data?.message || castError.message);
            } else {
                setError(castError.message);
            }

            console.error(castError);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData().then(r => r);
    }, deps ?? []);

    return { loading, error, data };
};
