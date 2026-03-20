import { createContext } from 'react';
import { SetURLSearchParams } from 'react-router-dom';

export const SearchParametersStateContext = createContext<
    [searchParams: URLSearchParams, setSearchParams: SetURLSearchParams]
>([new URLSearchParams(''), (_search: unknown) => {}]);
