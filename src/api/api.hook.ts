import axios, { AxiosRequestConfig, AxiosResponse, Method } from 'axios';

const baseUrl = 'https://helloworldseveryn.azurewebsites.net/api/';


export const callApi = <TData = any | null, TError = any | null>(
    method: Method,
    url: string,
    data?: TData,
): Promise<AxiosResponse<TData, TError>> => {
    const config: AxiosRequestConfig<TData> = {
        method,
        url: baseUrl + url,
        headers: {
            'Content-Type': 'application/json',
            'x-functions-key': 'HCBedLkPMCgfKqOboAhxkW_Q6SOvw4mQg0Ompp690ca0AzFuUXyDKg==',
            'Authorization': localStorage.getItem('token')
        },
        data: data
    };

    return axios.request<TData>(config);
};