import { createContext } from 'react';
import { SetURLSearchParams } from 'react-router-dom';

export const SearchParamsStateContext = createContext<
    [searchParams: URLSearchParams, setSearchParams: SetURLSearchParams]
>([new URLSearchParams(''), (_search: unknown) => {}]);
