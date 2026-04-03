import { useCallback, useContext, useEffect, useState } from 'react';

import { SearchParametersStateContext } from '@/fsd/5-shared/ui/contexts';

type NullableString = string | null | undefined;

export const useQueryState = <T>(
    queryParameter: string,
    stringToValue: (v: string | undefined) => T,
    valueToString: (v: T) => NullableString
): [T, (value: T) => void] => {
    const [searchParams, setSearchParameters] = useContext(SearchParametersStateContext);
    const queryParameterValue = searchParams.get(queryParameter) ?? undefined;
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
        [searchParams, setSearchParameters]
    );

    useEffect(() => {
        const queryParameterValueNew = searchParams.get(queryParameter) ?? undefined;
        setValue(stringToValue(queryParameterValueNew));
    }, [searchParams]);

    return [value, handleValueChange];
};
