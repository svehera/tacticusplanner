import React from 'react';
import { useSearchParams } from 'react-router-dom';

import { SearchParametersStateContext } from './search-parameters.context';

export const SearchParametersStateProvider = ({ children }: React.PropsWithChildren) => {
    const [searchParameters, setSearchParameters] = useSearchParams();

    return (
        <SearchParametersStateContext.Provider value={[searchParameters, setSearchParameters]}>
            {children}
        </SearchParametersStateContext.Provider>
    );
};
