import { useCallback, useContext, useEffect, useRef, useState } from 'react';

// eslint-disable-next-line import-x/no-internal-modules
import { DispatchContext } from '@/reducers/store.provider';

import { XpIncomeState } from './models';

// Debounces the movement of a slider so it doesn't overload the frontend with re-renders and context saves/loads.
export const useDebouncedState = <T extends XpIncomeState[K], K extends keyof XpIncomeState>(
    key: K,
    initialValue: T,
    globalState: XpIncomeState,
    delay: number = 500
): [T, (newValue: T) => void] => {
    const dispatch = useContext(DispatchContext);
    const [localValue, setLocalValue] = useState<T>(initialValue);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Sync local state if the global state changes externally
    useEffect(() => {
        setLocalValue(initialValue);
    }, [initialValue]);

    // Debounce logic: Dispatch to global store when localValue stops changing
    useEffect(() => {
        if (localValue === globalState[key]) {
            return;
        }

        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(() => {
            dispatch.xpIncomeState({
                type: 'SaveXpIncomeState',
                value: {
                    ...globalState,
                    [key]: localValue,
                },
            });
        }, delay);

        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, [localValue, globalState, dispatch, key, delay]);

    const setValue = useCallback((newValue: T) => {
        setLocalValue(newValue);
    }, []);

    return [localValue, setValue];
};
