import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { SearchParamsStateContext } from './search-params.context';

export const SearchParamsStateProvider = ({ children }: React.PropsWithChildren) => {
    const [searchParams, setSearchParams] = useSearchParams();

    return (
        <SearchParamsStateContext.Provider value={[searchParams, setSearchParams]}>
            {children}
        </SearchParamsStateContext.Provider>
    );
};
