import { Rarity, XP_BOOK_ORDER } from '@/fsd/5-shared/model';

import { MiscIcon } from '../icons';
import { AccessibleTooltip } from '../tooltip';

import { Select } from './select';

const bookIconName = (rarity: Rarity) => Rarity[rarity].toLowerCase() + 'Book';

export const BookSelect = ({
    label,
    tooltip,
    value,
    valueChanges,
}: {
    label?: string;
    tooltip?: string;
    value: Rarity;
    valueChanges: (value: Rarity) => void;
}) => {
    const select = (
        <Select
            options={XP_BOOK_ORDER}
            value={value}
            onChange={valueChanges}
            label={label}
            renderOption={rarity => (
                <div className="flex items-center gap-2">
                    <MiscIcon icon={bookIconName(rarity)} width={25} height={25} />
                    <span>{Rarity[rarity]}</span>
                </div>
            )}
        />
    );

    if (tooltip) {
        return (
            <AccessibleTooltip title={tooltip}>
                <div>{select}</div>
            </AccessibleTooltip>
        );
    }

    return select;
};
