import React from 'react';
import { useSearchParams } from 'react-router-dom';

import { SearchParametersStateContext } from './search-params.context';

export const SearchParametersStateProvider = ({ children }: React.PropsWithChildren) => {
    const [searchParams, setSearchParameters] = useSearchParams();

    return (
        <SearchParametersStateContext.Provider value={[searchParams, setSearchParameters]}>
            {children}
        </SearchParametersStateContext.Provider>
    );
};
