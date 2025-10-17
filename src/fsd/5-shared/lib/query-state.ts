import { useCallback, useContext, useEffect, useState } from 'react';

import { SearchParamsStateContext } from '@/fsd/5-shared/ui/contexts';

type NullableString = string | null | undefined;

export const useQueryState = <T>(
    queryParam: string,
    stringToValue: (v: string | null) => T,
    valueToString: (v: T) => NullableString
): [T, (value: T) => void] => {
    const [searchParams, setSearchParams] = useContext(SearchParamsStateContext);
    const queryParamValue = searchParams.get(queryParam);
    const initialState = stringToValue(queryParamValue);

    const [value, setValue] = useState<T>(initialState);

    const handleValueChange = useCallback(
        (newValue: T) => {
            setValue(newValue);
            const newQueryParam = valueToString(newValue);

            // Clone the current URLSearchParams before mutating to ensure
            // existing keys (e.g., activeTab) are preserved across updates.
            setSearchParams(
                curr => {
                    const next = new URLSearchParams(curr);
                    if (newQueryParam) {
                        next.set(queryParam, newQueryParam);
                    } else {
                        next.delete(queryParam);
                    }

                    return next;
                },
                { replace: true }
            );
        },
        [searchParams, setSearchParams]
    );

    useEffect(() => {
        const queryParamValueNew = searchParams.get(queryParam);
        setValue(stringToValue(queryParamValueNew));
    }, [searchParams]);

    return [value, handleValueChange];
};
