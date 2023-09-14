import { useState, useEffect } from 'react';
import axios, { AxiosRequestConfig, AxiosResponse, AxiosError, Method } from 'axios';

type ApiResponse<T> = {
    data: AxiosResponse<T> | null;
    isLoading: boolean;
    error: AxiosError | null;
};

const baseUrl = 'https://helloworldseveryn.azurewebsites.net';

export const useApi = <T = any | null>(
    config: AxiosRequestConfig<T>
): ApiResponse<T> => {
    const [data, setData] = useState<AxiosResponse<T> | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<AxiosError | null>(null);

    useEffect( () => {
        const fetchData = async () => {
            await axios.request<T>(config)
                .then(setData)
                .catch(setError)
                .finally(() => setIsLoading(false));
        };

        setIsLoading(true);
        fetchData();
        // setIsLoading(true);
        
    }, [config.method, config.url]);

    return { data, isLoading, error };
};
