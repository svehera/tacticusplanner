import axios, { AxiosError, AxiosResponse, Method } from 'axios';
import { useEffect, useState } from 'react';
import API from './api';
import { IErrorResponse } from './api.models';

const useApi = <TResponse, TRequestBody = any>(
    method: Method,
    url: string,
    body?: TRequestBody
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
        } catch (err: any) {
            const error = err as Error | AxiosError<IErrorResponse>;
            // replace here with your own error handling
            if (axios.isAxiosError(error)) {
                if (error.code === AxiosError.ERR_CANCELED) {
                    console.info('Request was canceled');
                    return;
                }
                setError(error?.response?.data?.message || error.message);
            } else {
                setError(error.message);
            }

            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData().then(r => r);
    }, []);

    return { loading, error, data };
};

export default useApi;
