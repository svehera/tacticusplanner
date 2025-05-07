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

            setSearchParams(
                curr => {
                    if (newQueryParam) {
                        curr.set(queryParam, newQueryParam);
                    } else {
                        curr.delete(queryParam);
                    }

                    return curr;
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
