import React, { useEffect, useMemo, useState } from 'react';

// eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { IMenuOption } from '@/models/menu-option';

// eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { MultipleSelect } from '@/fsd/5-shared/ui/input/multiple-select';

import { mowsData } from '@/fsd/4-entities/mow';
// eslint-disable-next-line import-x/no-internal-modules -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { isCharacter } from '@/fsd/4-entities/unit/units.functions';

// eslint-disable-next-line import-x/no-internal-modules, boundaries/element-types -- FYI: Ported from `v2` module; doesn't comply with `fsd` structure
import { IUnit } from '@/fsd/3-features/characters/characters.models';

interface Props {
    units: IUnit[];
    filterUnits: (filtered: IUnit[]) => void;
    selectedModes: string[];
    updateSelection: (value: string[]) => void;
}

export const IncursionModes: React.FC<Props> = ({ selectedModes, updateSelection, units, filterUnits }) => {
    const [mow, setMow] = useState<string>(() => {
        return selectedModes[0] ?? '';
    });
    const relatedMowData = mowsData.find(x => x.id === mow);

    const allowedUnits = useMemo(() => {
        if (relatedMowData) {
            return units.filter(x => x.alliance === relatedMowData.deployableAlliance && isCharacter(x));
        }
        return units;
    }, [mow]);

    const options: IMenuOption[] = mowsData.map(m => ({
        value: m.id,
        label: `${m.name} (using ${m.deployableAlliance})`,
        selected: false,
    }));

    const handleMowChange = (value: string[]) => {
        updateSelection(value);
        setMow(value[0]);
    };

    useEffect(() => {
        return filterUnits(allowedUnits);
    }, [allowedUnits]);

    return (
        <>
            <div className="flex-box gap5">
                <MultipleSelect
                    multiple={false}
                    label="MoW"
                    selected={[mow]}
                    options={options}
                    optionsChange={handleMowChange}
                    minWidth={150}
                />
            </div>
            {!!allowedUnits.length && <span>Available characters - {allowedUnits.length}</span>}
        </>
    );
};
