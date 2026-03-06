import React from 'react';
import { useSearchParams } from 'react-router-dom';

import { SearchParamsStateContext } from './search-params.context';

export const SearchParamsStateProvider = ({ children }: React.PropsWithChildren) => {
    const [searchParameters, setSearchParameters] = useSearchParams();

    return (
        <SearchParamsStateContext.Provider value={[searchParameters, setSearchParameters]}>
            {children}
        </SearchParamsStateContext.Provider>
    );
};
