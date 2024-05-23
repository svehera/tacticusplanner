import { useSearchParams } from 'react-router-dom';
import { useState } from 'react';

type NullableString = string | null | undefined;

export const useQueryState = <T>(
    queryParam: string,
    getInitialState: (v: string | null) => T,
    valueToString: (v: T) => NullableString
): [T, (value: T) => void] => {
    const [searchParams, setSearchParams] = useSearchParams();
    const queryParamValue = searchParams.get(queryParam);
    const initialState = getInitialState(queryParamValue);

    const [value, setValue] = useState<T>(initialState);

    const handleValueChange = (newValue: T) => {
        setValue(newValue);
        const newQueryParam = valueToString(newValue);

        setSearchParams(curr => {
            if (newQueryParam) {
                curr.set(queryParam, newQueryParam);
            } else {
                curr.delete(queryParam);
            }

            return curr;
        });
    };

    return [value, handleValueChange];
};
