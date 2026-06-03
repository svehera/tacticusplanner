/* eslint-disable boundaries/element-types */
import { factionLookup } from '@/fsd/5-shared/lib';
import { FactionId } from '@/fsd/5-shared/model';

import { FactionImage } from '@/fsd/4-entities/faction';

import { SelectMulti } from './select-multi';

export const FactionSelect = ({
    factionValues,
    value,
    valueChanges,
    label,
}: {
    label: string;
    factionValues: FactionId[];
    value: FactionId[];
    valueChanges: (value: FactionId[]) => void;
}) => (
    <SelectMulti
        options={factionValues}
        value={value}
        onChange={valueChanges}
        label={label}
        placeholder="Select factions"
        renderOption={faction => (
            <div className="flex items-center gap-3">
                <FactionImage faction={faction} />
                <span>{factionLookup[faction].name}</span>
            </div>
        )}
        renderValue={selected => (
            <div className="flex flex-wrap items-center gap-2">
                {selected.map(f => (
                    <FactionImage key={f} faction={f} />
                ))}
            </div>
        )}
    />
);
