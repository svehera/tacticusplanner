/* eslint-disable unicorn/no-null -- AG Grid signals "no filter" with a null model; that is its API, not a choice. */
import type { IDoesFilterPassParams } from 'ag-grid-community';
import { useGridFilter, type CustomFilterProps } from 'ag-grid-react';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { Button } from '@/fsd/5-shared/ui';

import { optionFilterPasses } from './damage-tab.utils';

/**
 * Checkbox-list column filter, i.e. the "set filter" AG Grid keeps behind Enterprise.
 *
 * The stock Community filters are text inputs, which is the wrong shape for a column with a small
 * closed set of values — you had to know that "Bomb" was spelled exactly that way, and nothing told
 * you which values existed. This lists every value actually present in the column and filters by
 * selection.
 *
 * Options are derived from the row data rather than passed in, so a column never offers a value the
 * current season does not contain.
 */
export const OptionFilter = ({
    model,
    onModelChange,
    getValue,
    api,
    column,
}: CustomFilterProps<unknown, unknown, string[]>) => {
    const [options, setOptions] = useState<string[]>([]);

    // AG Grid only learns a React filter's methods through `useGridFilter`; anything passed as
    // `filterParams.doesFilterPass` is spread into props and never read, so without this the grid
    // called `doesFilterPass` on an undefined method object and threw the moment a box was ticked.
    const doesFilterPass = useCallback(
        (params: IDoesFilterPassParams) => optionFilterPasses(model, getValue(params.node)),
        [model, getValue]
    );
    useGridFilter({ doesFilterPass });

    const readOptions = useCallback(() => {
        const seen = new Set<string>();
        api.forEachNode(node => {
            if (node.data === undefined) return;
            const value = getValue(node);
            if (typeof value === 'string' && value !== '') seen.add(value);
        });
        const next = [...seen].toSorted((a, b) => a.localeCompare(b));
        // Publish only a genuinely different list. AG Grid does not promise a stable `getValue`
        // identity, and this runs from an effect that depends on it — setting a fresh array every
        // time would re-render, hand back a new `getValue`, and run the effect again forever.
        setOptions(current =>
            current.length === next.length && current.every((value, index) => value === next[index]) ? current : next
        );
    }, [api, getValue]);

    // Row data arrives after mount and changes with the season, so the option list is rebuilt on
    // both rather than captured once.
    useEffect(() => {
        readOptions();
        api.addEventListener('rowDataUpdated', readOptions);
        return () => api.removeEventListener('rowDataUpdated', readOptions);
    }, [api, readOptions]);

    // `null` model means "no filter", which is every option rather than none.
    const selected = useMemo(() => new Set(model ?? options), [model, options]);
    const allSelected = model === null || selected.size === options.length;

    const commit = (next: Set<string>) => {
        // Everything selected is the same as no filter; clearing the model keeps AG Grid's
        // "column is filtered" indicator honest.
        onModelChange(next.size === options.length ? null : [...next]);
    };

    const toggle = (option: string) => {
        const next = new Set(selected);
        if (next.has(option)) next.delete(option);
        else next.add(option);
        commit(next);
    };

    if (options.length === 0) {
        return <div className="p-2 text-xs text-(--soft-fg)">No values to filter</div>;
    }

    return (
        <div className="flex max-h-64 min-w-44 flex-col gap-1 overflow-y-auto p-2">
            <Button
                appearance="plain"
                intent="primary"
                size="extra-small"
                className="mb-1 self-start"
                onPress={() => onModelChange(allSelected ? [] : null)}>
                {allSelected ? 'Clear all' : 'Select all'}
            </Button>
            {options.map(option => (
                <label key={option} className="flex cursor-pointer items-center gap-2 text-xs text-(--fg)">
                    <input
                        type="checkbox"
                        checked={selected.has(option)}
                        onChange={() => toggle(option)}
                        aria-label={`${column.getColDef().headerName ?? 'Value'}: ${option}`}
                    />
                    <span className="truncate">{option}</span>
                </label>
            ))}
        </div>
    );
};
