import { useState, useEffect } from 'react';
import axios, { AxiosRequestConfig, AxiosResponse, AxiosError, Method } from 'axios';

type ApiResponse<TData, TError = any> = {
    data: AxiosResponse<TData> | null;
    isLoading: boolean;
    error: AxiosError<TError> | null;
};

const baseUrl = 'https://helloworldseveryn.azurewebsites.net/api/';

export const useApi = <TData = any | null, TError = any | null>(
    method: Method,
    url: string,
): ApiResponse<TData> => {
    const [data, setData] = useState<AxiosResponse<TData> | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<AxiosError<TError> | null>(null);
    
    const config: AxiosRequestConfig<TData> = {
        method,
        url: baseUrl + url,
        headers: {
            'Content-Type': 'application/json',
            'x-functions-key': 'HCBedLkPMCgfKqOboAhxkW_Q6SOvw4mQg0Ompp690ca0AzFuUXyDKg==',
        }
    };

    useEffect( () => {
        const fetchData = async () => {
            await axios.request<TData>(config)
                .then(setData)
                .catch(setError)
                .finally(() => setIsLoading(false));
        };

        setIsLoading(true);
        fetchData();
        
    }, [method, url]);

    return { data, isLoading, error };
};
