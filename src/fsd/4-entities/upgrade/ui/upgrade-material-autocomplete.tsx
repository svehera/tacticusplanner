import { normalizeSearchText } from '@/fsd/5-shared/lib';
import { RarityString } from '@/fsd/5-shared/model';
import { ComboBox } from '@/fsd/5-shared/ui/selects';

import { IMaterial } from '../model';
import { UpgradeImage } from '../upgrade-image';

interface Props {
    value: IMaterial | undefined;
    options: IMaterial[];
    onChange?: (value: IMaterial | undefined) => void;
    label?: string;
    className?: string;
}

export const UpgradeMaterialAutocomplete = ({
    options,
    value,
    onChange = () => {},
    label = 'Material',
    className,
}: Props) => (
    <ComboBox<IMaterial>
        options={options}
        // eslint-disable-next-line unicorn/no-null -- Headless UI Combobox requires null for empty state
        value={value ?? null}
        onChange={v => onChange(v ?? undefined)}
        displayValue={item => item.material}
        filterFn={(option, query) => {
            const q = normalizeSearchText(query);
            if (!q) return true;
            return (
                normalizeSearchText(option.material).includes(q) || normalizeSearchText(option.snowprintId).includes(q)
            );
        }}
        renderOption={option => (
            <div className="flex items-center gap-2">
                <UpgradeImage
                    material={option.material}
                    iconPath={option.icon ?? ''}
                    rarity={option.rarity as RarityString}
                    size={36}
                    showTooltip={false}
                />
                <span>{option.material}</span>
            </div>
        )}
        by={(a, z) => a?.snowprintId === z?.snowprintId}
        label={label}
        placeholder="Search materials…"
        className={className}
    />
);
