import { normalizeSearchText } from '@/fsd/5-shared/lib';
import { ComboBox, ComboBoxMulti } from '@/fsd/5-shared/ui/selects';

import { IUnit } from '../model';

import { UnitTitle } from './unit-title';

interface Props<T extends IUnit> {
    unit: T | T[] | null;
    options: T[];
    onUnitChange?: (value: T | null) => void;
    onUnitsChange?: (value: T[]) => void;
    multiple?: boolean;
    label?: string;
    className?: string;
}

const hasShortName = (unit: IUnit): unit is IUnit & { shortName: string } => 'shortName' in unit;
const hasFullName = (unit: IUnit): unit is IUnit & { fullName: string } => 'fullName' in unit;

const getDisplayValue = (option: IUnit) => ('fullName' in option ? option.fullName : option.name);

const unitFilter = <T extends IUnit>(option: T, query: string): boolean => {
    const q = normalizeSearchText(query);
    if (!q) return true;
    const short = hasShortName(option) ? normalizeSearchText(option.shortName) : '';
    const normal = normalizeSearchText(option.name);
    const full = hasFullName(option) ? normalizeSearchText(option.fullName) : '';
    return full.includes(q) || normal.includes(q) || short.includes(q);
};

const renderUnitOption = <T extends IUnit>(option: T) => <UnitTitle character={option} short />;

export const UnitsAutocomplete = <T extends IUnit>({
    options,
    unit,
    multiple = false,
    onUnitChange = () => {},
    onUnitsChange = () => {},
    label = 'Unit',
    className,
}: Props<T>) => {
    if (multiple) {
        return (
            <ComboBoxMulti<T>
                options={options}
                value={Array.isArray(unit) ? unit : []}
                onChange={onUnitsChange}
                displayValue={getDisplayValue}
                filterFn={unitFilter}
                renderOption={renderUnitOption}
                by={(a, z) => a.snowprintId === z.snowprintId}
                label={label}
                placeholder="Search units…"
                className={className}
            />
        );
    }

    return (
        <ComboBox<T>
            options={options}
            // eslint-disable-next-line unicorn/no-null -- Headless UI Combobox requires null for empty state
            value={Array.isArray(unit) ? null : (unit ?? null)}
            onChange={onUnitChange}
            displayValue={getDisplayValue}
            filterFn={unitFilter}
            renderOption={renderUnitOption}
            by={(a, z) => a?.snowprintId === z?.snowprintId}
            label={label}
            placeholder="Search units…"
            className={className}
        />
    );
};
