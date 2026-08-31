import { Trait } from '@/fsd/5-shared/model';
import { TraitImage } from '@/fsd/5-shared/ui/icons';

import { SelectMulti } from './select-multi';

export const TraitSelect = ({
    traitValues,
    value,
    valueChanges,
    label,
    ariaLabel,
}: {
    label: string;
    traitValues: Trait[];
    value: Trait[];
    valueChanges: (value: Trait[]) => void;
    ariaLabel?: string;
}) => (
    <SelectMulti
        options={traitValues}
        value={value}
        onChange={valueChanges}
        label={label}
        ariaLabel={ariaLabel}
        placeholder="Select traits"
        renderOption={trait => (
            <div className="flex items-center gap-3">
                <TraitImage trait={trait} width={20} height={20} />
                <span>{trait}</span>
            </div>
        )}
        renderValue={selected => (
            <div className="flex flex-wrap items-center gap-2">
                {selected.map(t => (
                    <TraitImage key={t} trait={t} width={18} height={18} />
                ))}
            </div>
        )}
    />
);
