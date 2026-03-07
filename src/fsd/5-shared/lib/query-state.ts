import { useCallback, useContext, useEffect, useState } from 'react';

import { SearchParamsStateContext } from '@/fsd/5-shared/ui/contexts';

export const useQueryState = <T>(
    queryParameter: string,
    stringToValue: (v: string | undefined) => T,
    valueToString: (v: T) => string | undefined
): [T, (value: T) => void] => {
    const [searchParameters, setSearchParameters] = useContext(SearchParamsStateContext);
    const queryParameterValue = searchParameters.get(queryParameter) ?? undefined;
    const initialState = stringToValue(queryParameterValue);

    const [value, setValue] = useState<T>(initialState);

    const handleValueChange = useCallback(
        (newValue: T) => {
            setValue(newValue);
            const newQueryParameter = valueToString(newValue);

            // Clone the current URLSearchParams before mutating to ensure
            // existing keys (e.g., activeTab) are preserved across updates.
            setSearchParameters(
                current => {
                    const next = new URLSearchParams(current);
                    if (newQueryParameter) {
                        next.set(queryParameter, newQueryParameter);
                    } else {
                        next.delete(queryParameter);
                    }

                    return next;
                },
                { replace: true }
            );
        },
        [searchParameters, setSearchParameters]
    );

    useEffect(() => {
        const queryParameterValueNew = searchParameters.get(queryParameter) ?? undefined;
        setValue(stringToValue(queryParameterValueNew));
    }, [searchParameters]);

    return [value, handleValueChange];
};
