import axios, { AxiosError, AxiosResponse, Method } from 'axios';

import API from './api';
import { IErrorResponse } from './api.models';

export const makeApiCall = <TResponse, TRequestBody = any>(
    method: Method,
    url: string,
    body?: TRequestBody
): Promise<{ data: TResponse | undefined; error: AxiosError<IErrorResponse> | string | undefined }> => {
    const fetchData = async () => {
        try {
            const response = await API<TResponse, AxiosResponse<TResponse>, TRequestBody>({
                url: url,
                method: method,
                data: body,
            });

            const data = response?.data;

            return { data, error: undefined };
        } catch (error: any) {
            console.error(error);
            const castError = error as Error | AxiosError<IErrorResponse>;
            // replace here with your own error handling
            if (axios.isAxiosError(castError)) {
                if (castError.code === AxiosError.ERR_CANCELED) {
                    console.info('Request was canceled');
                    return { data: undefined, error: undefined };
                }
                castError.message = castError?.response?.data?.message || castError.message;
                return { data: undefined, error: castError };
            } else {
                console.error(`Unexpected error during API call`, castError);
                return { data: undefined, error: castError.message };
            }
        }
    };

    return fetchData();
};
