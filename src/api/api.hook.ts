import axios, { AxiosRequestConfig, AxiosResponse, Method } from 'axios';

const baseUrl = import.meta.env.VITE_API_HOST + '/api/';

export const callApi = <TData = any | null, TError = any | null, TResponse = TData>(
    method: Method,
    url: string,
    data?: TData
): Promise<AxiosResponse<TResponse, TError>> => {
    const config: AxiosRequestConfig<TData> = {
        method,
        url: baseUrl + url,
        headers: {
            'Content-Type': 'application/json',
            'x-functions-key': import.meta.env.VITE_FUNCTIONS_KEY,
            Authorization: localStorage.getItem('token'),
        },
        data: data,
    };

    return axios.request<TResponse>(config);
};
